// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  handleAssistantRequest,
  isAssistantEnabled,
  resetAssistantLimiters,
  resolveProviderId,
} from './handler'
import type { AssistantEnv } from './handler'
import { ProviderError } from './provider'
import {
  DEFAULT_WORKERS_AI_MODEL,
  bindingRunner,
  createWorkersAiProvider,
  extractText,
  restRunner,
} from './workersAi'
import type { WorkersAiRun } from './workersAi'

const ORIGIN = 'https://atmos.example'
const TOKEN = 'cf-token-do-not-leak'
const signal = () => new AbortController().signal
const input = (s = signal()) => ({
  system: 'SYS',
  messages: [{ role: 'user' as const, content: 'Umbrella?' }],
  signal: s,
})

beforeEach(() => {
  resetAssistantLimiters()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('extractText', () => {
  it.each([
    ['a plain string', '  Hello. ', 'Hello.'],
    ['the older { response } shape', { response: ' Hello. ' }, 'Hello.'],
    [
      'the OpenAI chat shape',
      { choices: [{ message: { role: 'assistant', content: 'Hello.' } }] },
      'Hello.',
    ],
    ['the OpenAI completion shape', { choices: [{ text: 'Hello.' }] }, 'Hello.'],
    [
      'content given as parts',
      {
        choices: [
          {
            message: {
              content: [
                { type: 'text', text: 'Hel' },
                { type: 'text', text: 'lo.' },
              ],
            },
          },
        ],
      },
      'Hello.',
    ],
    ['a REST result nested one level down', { result: { response: 'Hello.' } }, 'Hello.'],
  ])('reads %s', (_name, output, expected) => expect(extractText(output)).toBe(expected))

  it.each([
    null,
    undefined,
    42,
    {},
    { response: '   ' },
    { choices: [] },
    { choices: [{ message: {} }] },
  ])('finds no text in %j', (output) => expect(extractText(output)).toBeNull())

  it('never reads separate reasoning text', () => {
    const output = {
      choices: [{ message: { content: 'Answer.', reasoning_content: 'secret chain of thought' } }],
    }
    expect(extractText(output)).toBe('Answer.')
    expect(
      extractText({ choices: [{ message: { reasoning_content: 'only thinking' } }] }),
    ).toBeNull()
  })
})

describe('Workers AI provider', () => {
  it('sends the instructions as a system message, then the conversation, with small limits', async () => {
    const run = vi.fn<WorkersAiRun>().mockResolvedValue({ response: 'Take one.' })
    const provider = createWorkersAiProvider({ run })

    expect(provider.id).toBe('cloudflare')
    expect(provider.model).toBe(DEFAULT_WORKERS_AI_MODEL)
    expect(await provider.answer(input())).toBe('Take one.')

    const [model, body] = run.mock.calls[0] ?? []
    expect(model).toBe('@cf/google/gemma-4-26b-a4b-it')
    expect(body).toMatchObject({
      messages: [
        { role: 'system', content: 'SYS' },
        { role: 'user', content: 'Umbrella?' },
      ],
      stream: false,
    })
    expect((body as { max_tokens: number }).max_tokens).toBeLessThanOrEqual(700)
    expect((body as { temperature: number }).temperature).toBeLessThanOrEqual(0.5)
  })

  it('uses the model from the environment when given', () => {
    expect(
      createWorkersAiProvider({ run: vi.fn(), model: ' @cf/meta/llama-3.1-8b-instruct ' }).model,
    ).toBe('@cf/meta/llama-3.1-8b-instruct')
  })

  it('reports an empty reply', async () => {
    const run = vi.fn<WorkersAiRun>().mockResolvedValue({ choices: [] })
    await expect(createWorkersAiProvider({ run }).answer(input())).rejects.toMatchObject({
      failure: 'failed',
    })
  })

  it('stops a binding call that outlives the time limit', async () => {
    const controller = new AbortController()
    const never = bindingRunner({ run: () => new Promise(() => undefined) })
    const pending = never('m', {}, controller.signal)
    controller.abort()
    await expect(pending).rejects.toThrow(/timed out/i)
  })
})

describe('Workers AI over REST', () => {
  const reply = (body: unknown, status = 200) =>
    vi.fn<typeof fetch>(() => Promise.resolve(Response.json(body, { status })))

  it('calls the account’s run endpoint with the token, and unwraps the result', async () => {
    const fetchImpl = reply({ success: true, errors: [], result: { response: 'Hi.' } })
    const run = restRunner({ accountId: 'acc 1', apiToken: TOKEN, fetchImpl })

    const output = await run('@cf/google/gemma-4-26b-a4b-it', { messages: [] }, signal())
    expect(output).toEqual({ response: 'Hi.' })

    const [url, init] = fetchImpl.mock.calls[0] ?? []
    expect(String(url)).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acc%201/ai/run/@cf/google/gemma-4-26b-a4b-it',
    )
    expect((init?.headers as Record<string, string>).authorization).toBe(`Bearer ${TOKEN}`)
    expect(init?.method).toBe('POST')
  })

  const failing = (status: number, message: string) =>
    createWorkersAiProvider({
      run: restRunner({
        accountId: 'a',
        apiToken: TOKEN,
        fetchImpl: reply({ success: false, errors: [{ message }], result: null }, status),
      }),
    }).answer(input())

  it.each([
    [401, 'Authentication error', 'misconfigured'],
    [403, 'The API token lacks permission', 'misconfigured'],
    [403, 'You have used up your daily free allocation of 10,000 neurons', 'quota'],
    [429, 'Too many requests', 'quota'],
    [400, 'because you have exceeded the daily limit', 'quota'],
    [500, 'Internal error', 'unavailable'],
    [503, 'Service unavailable', 'unavailable'],
    [400, 'Invalid input', 'failed'],
  ])('maps HTTP %i (%s) to %s', async (status, message, failure) => {
    await expect(failing(status, message)).rejects.toMatchObject({ failure })
    await expect(failing(status, message)).rejects.toBeInstanceOf(ProviderError)
  })

  it('treats a network failure as unavailable and a non-JSON reply as an error', async () => {
    const offline = createWorkersAiProvider({
      run: restRunner({
        accountId: 'a',
        apiToken: TOKEN,
        fetchImpl: () => Promise.reject(new TypeError('offline')),
      }),
    })
    await expect(offline.answer(input())).rejects.toMatchObject({ failure: 'unavailable' })

    const html = createWorkersAiProvider({
      run: restRunner({
        accountId: 'a',
        apiToken: TOKEN,
        fetchImpl: () => Promise.resolve(new Response('<html>', { status: 502 })),
      }),
    })
    await expect(html.answer(input())).rejects.toMatchObject({ failure: 'unavailable' })
  })

  it('treats a binding quota error like a REST one', async () => {
    const provider = createWorkersAiProvider({
      run: () => Promise.reject(new Error('3036: you have used up your daily free allocation')),
    })
    await expect(provider.answer(input())).rejects.toMatchObject({ failure: 'quota' })
  })
})

describe('choosing the provider', () => {
  const rest = { CLOUDFLARE_ACCOUNT_ID: 'a', CLOUDFLARE_API_TOKEN: TOKEN }
  const anthropic = { ANTHROPIC_API_KEY: 'sk-ant-x' }
  const binding = { AI: { run: () => Promise.resolve({}) } }

  it('prefers the free provider when both are set up, and honours an explicit choice', () => {
    expect(resolveProviderId({})).toBeNull()
    expect(resolveProviderId(rest)).toBe('cloudflare')
    expect(resolveProviderId(binding)).toBe('cloudflare')
    expect(resolveProviderId(anthropic)).toBe('anthropic')
    expect(resolveProviderId({ ...rest, ...anthropic })).toBe('cloudflare')
    expect(resolveProviderId({ ...rest, ...anthropic, ASSISTANT_PROVIDER: 'anthropic' })).toBe(
      'anthropic',
    )
    expect(resolveProviderId({ ...rest, ASSISTANT_PROVIDER: 'anthropic' })).toBeNull()
    expect(resolveProviderId({ ...anthropic, ASSISTANT_PROVIDER: 'cloudflare' })).toBeNull()
  })

  it('needs both the account id and the token for REST, and is off without the switch', () => {
    expect(resolveProviderId({ CLOUDFLARE_ACCOUNT_ID: 'a' })).toBeNull()
    expect(resolveProviderId({ CLOUDFLARE_API_TOKEN: TOKEN })).toBeNull()
    expect(isAssistantEnabled({ ...rest })).toBe(false)
    expect(isAssistantEnabled({ ...rest, ASSISTANT_ENABLED: 'true' })).toBe(true)
  })

  it('answers end to end through a Worker binding, naming the provider in its status', async () => {
    const run = vi
      .fn()
      .mockResolvedValue({ choices: [{ message: { content: 'Yes, take an umbrella.' } }] })
    const env: AssistantEnv = { ASSISTANT_ENABLED: 'true', AI: { run } }

    const status = await handleAssistantRequest(new Request(`${ORIGIN}/api/assistant`), env)
    expect(await status.json()).toEqual({ enabled: true, provider: 'cloudflare' })

    const response = await handleAssistantRequest(
      new Request(`${ORIGIN}/api/assistant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Umbrella?' }],
          context: { placeName: 'Berlin', text: 'Chance of rain today: 80%' },
        }),
      }),
      env,
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ answer: 'Yes, take an umbrella.' })
    const [model, body] = run.mock.calls[0] ?? []
    expect(model).toBe(DEFAULT_WORKERS_AI_MODEL)
    expect(JSON.stringify(body)).toContain('Chance of rain today: 80%')
  })

  it('tells visitors the daily allowance is used up, without leaking details', async () => {
    const env: AssistantEnv = {
      ASSISTANT_ENABLED: 'true',
      AI: { run: () => Promise.reject(new Error('daily free allocation used up, token abc')) },
    }
    const response = await handleAssistantRequest(
      new Request(`${ORIGIN}/api/assistant`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Umbrella?' }],
          context: { placeName: 'Berlin', text: 'x' },
        }),
      }),
      env,
    )
    expect(response.status).toBe(503)
    const text = await response.text()
    expect(JSON.parse(text)).toMatchObject({ error: { code: 'daily-limit' } })
    expect(text).not.toContain('token abc')
  })
})
