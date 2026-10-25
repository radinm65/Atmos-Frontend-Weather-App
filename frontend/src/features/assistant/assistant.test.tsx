import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ASSISTANT_LIMITS } from '../../lib/assistant/contract'
import type { AssistantRequest } from '../../lib/assistant/contract'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { fixtureReport, createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY } from '../locations/activeLocationStorage'
import { PREFERENCES_KEY } from '../preferences/preferencesStorage'
import { AssistantError, createHttpAssistantService, describeAssistantError } from './assistantApi'
import { EMERGENCY_NOTICE, looksLikeEmergency } from './emergency'
import { buildAssistantContext } from './weatherContext'
import { DEFAULT_UNITS } from '../../lib/formatting'

vi.mock('../overview/HourlyChart', () => ({ default: () => <div /> }))
vi.mock('../overview/WindChart', () => ({ default: () => <div /> }))

const json = (body: unknown, init?: ResponseInit) => Response.json(body, init)

describe('buildAssistantContext', () => {
  it('describes the place, time zone, data source, units and the forecast', () => {
    const { placeName, text } = buildAssistantContext(fixtureReport(), DEFAULT_UNITS)
    expect(placeName).toBe('Berlin')
    expect(text).toContain('Place: Berlin, State of Berlin, Germany')
    expect(text).toContain('Time zone: Europe/Berlin')
    expect(text).toContain('live forecast')
    expect(text).toContain('Temperatures are in °C, wind in km/h')
    expect(text).toMatch(/NOW \(\d\d:\d\d\):/)
    expect(text).toContain('TODAY:')
    expect(text).toContain('NEXT 24 HOURS (every 3 hours):')
    expect(text).toMatch(/NEXT \d+ DAYS:/)
    expect(text).not.toMatch(/NaN|undefined|null/)
  })

  it('uses the person’s units, converting at the edge only', () => {
    const report = fixtureReport()
    const metric = buildAssistantContext(report, DEFAULT_UNITS).text
    const imperial = buildAssistantContext(report, { temperature: 'f', windSpeed: 'mph' }).text
    expect(imperial).toContain('Temperatures are in °F, wind in mph')
    expect(imperial).toMatch(/°F/)
    expect(imperial).toContain('mph')
    expect(imperial).not.toMatch(/\d°C/)
    expect(metric).not.toMatch(/\d°F|mph/)
  })

  it('writes missing values as "not available" and never as zero', () => {
    const report = fixtureReport()
    report.current = {
      ...report.current,
      humidity: null,
      windGusts: null,
      uvIndex: null,
      visibility: null,
    }
    const { text } = buildAssistantContext(report, DEFAULT_UNITS)
    expect(text).toContain('Humidity: not available')
    expect(text).toContain('gusts not available')
    expect(text).toContain('UV index: not available')
    expect(text).toContain('Visibility: not available')
  })

  it('says plainly when the data is a recorded snapshot, and when it was recorded', () => {
    const report = {
      ...fixtureReport(),
      source: { kind: 'snapshot' as const, capturedAt: '2026-10-24T10:00:00Z' },
    }
    const { text } = buildAssistantContext(report, DEFAULT_UNITS)
    expect(text).toContain('RECORDED SNAPSHOT, captured 2026-10-24T10:00:00Z. It is not live.')
  })

  it('stays within the size the endpoint accepts', () => {
    const report = fixtureReport()
    report.location = { ...report.location, name: 'x'.repeat(500) }
    const { placeName, text } = buildAssistantContext(report, DEFAULT_UNITS)
    expect(placeName.length).toBeLessThanOrEqual(ASSISTANT_LIMITS.placeNameChars)
    expect(text.length).toBeLessThanOrEqual(ASSISTANT_LIMITS.contextChars)
  })
})

describe('looksLikeEmergency', () => {
  it.each([
    'There is a tornado warning, what do I do?',
    'Is the flooding going to get worse?',
    'Should we evacuate?',
    'I think I am in danger from lightning',
    'wildfire smoke near me',
  ])('flags %s', (question) => expect(looksLikeEmergency(question)).toBe(true))

  it.each([
    'Do I need an umbrella?',
    'What is the high tomorrow?',
    'Will it be windy at the beach?',
  ])('does not flag %s', (question) => expect(looksLikeEmergency(question)).toBe(false))
})

describe('createHttpAssistantService', () => {
  const service = (fetchImpl: typeof fetch) =>
    createHttpAssistantService({ endpoint: '/api/assistant', fetchImpl })
  const request: AssistantRequest = {
    messages: [{ role: 'user', content: 'Hi' }],
    context: { placeName: 'Berlin', text: 'Now: 14°C' },
  }

  it.each([
    ['enabled', () => json({ enabled: true }), { state: 'ready', provider: null }],
    [
      'enabled, naming its provider',
      () => json({ enabled: true, provider: 'cloudflare' }),
      { state: 'ready', provider: 'cloudflare' },
    ],
    ['switched off', () => json({ enabled: false }), { state: 'not-configured' }],
    ['missing (404)', () => json({}, { status: 404 }), { state: 'not-configured' }],
    [
      'the app’s own HTML page',
      () => new Response('<!doctype html>', { status: 200 }),
      { state: 'not-configured' },
    ],
    ['a server error', () => json({}, { status: 500 }), { state: 'unreachable' }],
    ['an unexpected payload', () => json({ hello: 1 }), { state: 'not-configured' }],
  ])('reads the status when the endpoint is %s', async (_name, respond, expected) => {
    expect(await service(() => Promise.resolve(respond())).getStatus()).toEqual(expected)
  })

  it('reports an unreachable endpoint', async () => {
    expect(await service(() => Promise.reject(new TypeError('offline'))).getStatus()).toEqual({
      state: 'unreachable',
    })
  })

  it('posts the request as JSON and returns the answer', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(json({ answer: 'Take an umbrella.' })),
    )
    expect(await service(fetchImpl).ask(request)).toBe('Take an umbrella.')
    const [, init] = fetchImpl.mock.calls[0] ?? []
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual(request)
  })

  it('turns error replies into typed errors, keeping the retry delay', async () => {
    const limited = service(() =>
      Promise.resolve(
        json(
          { error: { code: 'rate-limited', message: 'Slow down' } },
          { status: 429, headers: { 'retry-after': '42' } },
        ),
      ),
    )
    await expect(limited.ask(request)).rejects.toMatchObject({
      code: 'rate-limited',
      retryAfterSeconds: 42,
    })

    const odd = service(() => Promise.resolve(json({ nope: true }, { status: 500 })))
    await expect(odd.ask(request)).rejects.toMatchObject({ code: 'failed' })

    const notJson = service(() => Promise.resolve(new Response('<html>', { status: 502 })))
    await expect(notJson.ask(request)).rejects.toMatchObject({ code: 'failed' })

    const offline = service(() => Promise.reject(new TypeError('offline')))
    await expect(offline.ask(request)).rejects.toMatchObject({ code: 'network' })

    const badAnswer = service(() => Promise.resolve(json({ answer: '' })))
    await expect(badAnswer.ask(request)).rejects.toMatchObject({ code: 'failed' })
  })

  it('describes errors for people, and says whether trying again can help', () => {
    expect(describeAssistantError(new AssistantError('network', 'x'))).toMatchObject({
      retryable: true,
    })
    expect(describeAssistantError(new AssistantError('refused', 'No.'))).toEqual({
      message: 'No.',
      retryable: false,
    })
    expect(describeAssistantError(new AssistantError('rate-limited', 'x', 30)).message).toContain(
      '30 seconds',
    )
    expect(describeAssistantError(new Error('boom'))).toMatchObject({ retryable: true })
  })
})

describe('Assistant page', () => {
  interface Route {
    status?: () => Response
    answer?: (request: AssistantRequest) => Response
  }
  function stubAssistant(route: Route = {}) {
    const asked: AssistantRequest[] = []
    const fetchMock = vi.fn<typeof fetch>((input, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as AssistantRequest
        asked.push(body)
        return Promise.resolve(
          route.answer?.(body) ?? json({ answer: 'It looks mild, with a 20% chance of rain.' }),
        )
      }
      void input
      return Promise.resolve(route.status?.() ?? json({ enabled: true }))
    })
    vi.stubGlobal('fetch', fetchMock)
    return { asked, fetchMock }
  }

  afterEach(() => vi.unstubAllGlobals())

  const withBerlin = () => window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
  const textbox = () => screen.findByRole('textbox', { name: /Ask about the weather in Berlin/ })

  it('is honest when the assistant is not switched on: no chat box, no fake answers', async () => {
    withBerlin()
    stubAssistant({ status: () => json({ enabled: false }) })
    renderApp('/assistant', { source: createFakeSource().source })

    expect(
      await screen.findByRole('heading', { name: 'The assistant is not switched on' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'Forecast' })
    expect(links.every((link) => link.getAttribute('href') === '/forecast')).toBe(true)
  })

  it('treats a site with no assistant endpoint at all the same way', async () => {
    withBerlin()
    stubAssistant({ status: () => new Response('<!doctype html>', { status: 200 }) })
    renderApp('/assistant', { source: createFakeSource().source })
    expect(
      await screen.findByRole('heading', { name: 'The assistant is not switched on' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('offers a retry when the assistant service cannot be reached', async () => {
    withBerlin()
    stubAssistant({ status: () => json({}, { status: 503 }) })
    renderApp('/assistant', { source: createFakeSource().source })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/rest of Atmos still works/)
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('asks for a place first when none is chosen', async () => {
    stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Ask about the weather/ })).not.toBeInTheDocument()
  })

  it('sends the question with the forecast shown on the page and shows the answer', async () => {
    withBerlin()
    const { asked } = stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })

    await userEvent.type(await textbox(), 'Do I need an umbrella?{Enter}')
    expect(await screen.findByText('It looks mild, with a 20% chance of rain.')).toBeInTheDocument()

    expect(asked).toHaveLength(1)
    expect(asked[0]?.messages).toEqual([{ role: 'user', content: 'Do I need an umbrella?' }])
    expect(asked[0]?.context.placeName).toBe('Berlin')
    expect(asked[0]?.context.text).toContain('Time zone: Europe/Berlin')
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('answers a suggested question with one click', async () => {
    withBerlin()
    const { asked } = stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Do I need an umbrella today?' }),
    )
    await screen.findByText(/chance of rain/)
    expect(asked[0]?.messages[0]?.content).toBe('Do I need an umbrella today?')
  })

  it('keeps the conversation going, sending the earlier turns, and never more than the endpoint allows', async () => {
    withBerlin()
    const { asked } = stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })

    for (let n = 1; n <= 5; n += 1) {
      await userEvent.type(await textbox(), `Question ${n}{Enter}`)
      await waitFor(() => expect(screen.getAllByText(/chance of rain/)).toHaveLength(n))
    }
    expect(asked[1]?.messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user'])
    const last = asked[4]?.messages ?? []
    expect(last.length).toBeLessThanOrEqual(ASSISTANT_LIMITS.historyMessages)
    expect(last[0]?.role).toBe('user')
    expect(last.at(-1)).toEqual({ role: 'user', content: 'Question 5' })
  })

  it('uses the person’s units in what it sends', async () => {
    withBerlin()
    window.localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ units: { temperature: 'f', windSpeed: 'mph' } }),
    )
    const { asked } = stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })
    await userEvent.type(await textbox(), 'Hot?{Enter}')
    await screen.findByText(/chance of rain/)
    expect(asked[0]?.context.text).toContain('Temperatures are in °F, wind in mph')
  })

  it('shows the app’s own safety notice beside an emergency-sounding question', async () => {
    withBerlin()
    stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })
    await userEvent.type(await textbox(), 'There is a tornado warning, what now?{Enter}')
    const note = await screen.findByRole('note')
    expect(note).toHaveTextContent(EMERGENCY_NOTICE)
  })

  it('shows an error with a retry that does not repeat the question', async () => {
    withBerlin()
    let fail = true
    const { asked } = stubAssistant({
      answer: () =>
        fail
          ? json(
              {
                error: {
                  code: 'provider-unavailable',
                  message: 'The assistant is unavailable right now. Please try again in a moment.',
                },
              },
              { status: 503 },
            )
          : json({ answer: 'Back again: dry all day.' }),
    })
    renderApp('/assistant', { source: createFakeSource().source })

    await userEvent.type(await textbox(), 'Rain later?{Enter}')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/unavailable right now/)
    expect(screen.getAllByText('Rain later?')).toHaveLength(1)

    fail = false
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Back again: dry all day.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByText('Rain later?')).toHaveLength(1)
    expect(asked).toHaveLength(2)
  })

  it('does not offer a retry for an answer the assistant refused to give', async () => {
    withBerlin()
    stubAssistant({
      answer: () =>
        json(
          { error: { code: 'refused', message: 'The assistant could not answer that question.' } },
          { status: 422 },
        ),
    })
    renderApp('/assistant', { source: createFakeSource().source })
    await userEvent.type(await textbox(), 'Something odd{Enter}')
    const alert = await screen.findByRole('alert')
    expect(within(alert).queryByRole('button')).not.toBeInTheDocument()
  })

  it('limits the question length, ignores empty questions, and can clear the conversation', async () => {
    withBerlin()
    const { asked } = stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })

    const box = await textbox()
    expect(box).toHaveAttribute('maxlength', String(ASSISTANT_LIMITS.questionChars))
    expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled()
    await userEvent.type(box, '   {Enter}')
    expect(asked).toHaveLength(0)

    await userEvent.type(box, 'Windy?{Enter}')
    await screen.findByText(/chance of rain/)
    await userEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
    expect(screen.queryByText(/chance of rain/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Do I need an umbrella today?' })).toBeInTheDocument()
  })

  it('tells the person what is sent and where, and that answers can be wrong', async () => {
    withBerlin()
    stubAssistant()
    renderApp('/assistant', { source: createFakeSource().source })
    await textbox()
    expect(screen.getByText(/AI answers can be wrong/)).toBeInTheDocument()
    expect(screen.getByText(/sent to our server and to the AI provider/)).toBeInTheDocument()
  })
})
