import { ProviderError } from './provider'
import type { AssistantProvider } from './provider'

/**
 * Cloudflare Workers AI as the assistant's provider. It has a free daily allowance (10,000
 * "neurons") and, on the Workers Free plan, stops with an error at the limit instead of billing.
 * Cloudflare states that it does not train on or keep content sent through Workers AI. Read on
 * 2026-10-25 from developers.cloudflare.com/workers-ai (pricing and data-usage pages).
 *
 * Two ways in, same provider: the `AI` binding inside a Worker (no key at all), or the REST API
 * with an account id and API token (used by `npm run dev`).
 */

/**
 * Gemma 4 26B-A4B: $0.10/$0.30 per million tokens, which is about 9,100 and 27,300 neurons per
 * million. One question (about 1,700 tokens in, 300 out) is roughly 25 neurons, so the free
 * 10,000 a day covers a few hundred questions.
 */
export const DEFAULT_WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it'
const MAX_OUTPUT_TOKENS = 700
/** Low, so answers stay close to the supplied numbers. */
const TEMPERATURE = 0.3

/** Runs one model call and returns the model's raw output (a Worker binding or the REST API). */
export type WorkersAiRun = (
  model: string,
  input: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<unknown>

/** What a Worker's `AI` binding looks like to this code. */
export interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>
}

class WorkersAiHttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'WorkersAiHttpError'
    this.status = status
  }
}

export function bindingRunner(ai: AiBinding): WorkersAiRun {
  return (model, input, signal) =>
    new Promise((resolve, reject) => {
      // The binding takes no abort signal, so stop waiting when the time limit passes.
      const onAbort = () => reject(new Error('Timed out waiting for Workers AI'))
      if (signal.aborted) return onAbort()
      signal.addEventListener('abort', onAbort, { once: true })
      ai.run(model, input).then(resolve, reject)
    })
}

export function restRunner(options: {
  accountId: string
  apiToken: string
  fetchImpl?: typeof fetch
}): WorkersAiRun {
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  return async (model, input, signal) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(options.accountId)}/ai/run/${model}`
    const response = await doFetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${options.apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
      signal,
    })
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new WorkersAiHttpError(response.status, 'Workers AI sent a reply that was not JSON')
    }
    const envelope = (typeof body === 'object' && body !== null ? body : {}) as {
      success?: boolean
      result?: unknown
      errors?: { message?: string }[]
    }
    if (!response.ok || envelope.success === false) {
      const message = (envelope.errors ?? []).map((error) => error.message).join('; ')
      throw new WorkersAiHttpError(
        response.status,
        message || `Workers AI error ${response.status}`,
      )
    }
    return envelope.result
  }
}

/**
 * Reads the text out of a model reply. Older models answer `{ response: "..." }`; newer ones use
 * the OpenAI chat shape `{ choices: [{ message: { content } }] }`. Anything else yields `null`.
 * Reasoning text, when a model returns it separately, is never read.
 */
export function extractText(output: unknown): string | null {
  if (typeof output === 'string') return output.trim() || null
  if (typeof output !== 'object' || output === null) return null
  const reply = output as {
    response?: unknown
    result?: unknown
    choices?: { message?: { content?: unknown }; text?: unknown }[]
  }
  if (typeof reply.response === 'string') return reply.response.trim() || null
  const choice = reply.choices?.[0]
  const content = choice?.message?.content ?? choice?.text
  if (typeof content === 'string') return content.trim() || null
  if (Array.isArray(content)) {
    const joined = content
      .map((part) =>
        typeof part === 'object' && part !== null && 'text' in part ? String(part.text) : '',
      )
      .join('')
      .trim()
    return joined || null
  }
  return reply.result === undefined ? null : extractText(reply.result)
}

/** Messages that mean "today's free allowance is gone", whatever the status code. */
const QUOTA_TEXT = /neurons|daily|allocation|free tier|quota|limit/i

function toProviderError(error: unknown, signal: AbortSignal): ProviderError {
  if (signal.aborted)
    return new ProviderError('unavailable', 'Workers AI timed out', { cause: error })
  const status = error instanceof WorkersAiHttpError ? error.status : undefined
  const message = error instanceof Error ? error.message : ''
  if (status === 401 || status === 403) {
    // A 403 can also mean the allowance ran out, which Cloudflare words as a limit.
    return QUOTA_TEXT.test(message) && !/token|permission|authenticat/i.test(message)
      ? new ProviderError('quota', 'The Workers AI allowance is used up', { cause: error })
      : new ProviderError('misconfigured', 'Workers AI rejected the credentials', { cause: error })
  }
  if (status === 429 || (status !== undefined && status < 500 && QUOTA_TEXT.test(message))) {
    return new ProviderError('quota', 'The Workers AI allowance is used up', { cause: error })
  }
  if (status !== undefined && status >= 500) {
    return new ProviderError('unavailable', 'Workers AI had a problem', { cause: error })
  }
  if (status === undefined && QUOTA_TEXT.test(message)) {
    return new ProviderError('quota', 'The Workers AI allowance is used up', { cause: error })
  }
  if (status === undefined) {
    return new ProviderError('unavailable', 'Workers AI could not be reached', { cause: error })
  }
  return new ProviderError('failed', 'Workers AI rejected the request', { cause: error })
}

export function createWorkersAiProvider(options: {
  run: WorkersAiRun
  model?: string
}): AssistantProvider {
  const model = options.model?.trim() || DEFAULT_WORKERS_AI_MODEL
  return {
    id: 'cloudflare',
    model,
    async answer({ system, messages, signal }) {
      const chat: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: system },
        ...messages.map(({ role, content }) => ({ role, content })),
      ]
      let output: unknown
      try {
        output = await options.run(
          model,
          {
            messages: chat,
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: TEMPERATURE,
            stream: false,
          },
          signal,
        )
      } catch (error) {
        throw toProviderError(error, signal)
      }
      const text = extractText(output)
      if (!text) throw new ProviderError('failed', 'Workers AI returned no text')
      return text
    },
  }
}
