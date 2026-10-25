import { ASSISTANT_LIMITS, assistantRequestSchema } from '../../src/lib/assistant/contract'
import type { AssistantErrorCode, AssistantProviderId } from '../../src/lib/assistant/contract'
import { buildSystemPrompt } from './prompt'
import { ProviderError, createAnthropicProvider } from './provider'
import type { AssistantProvider } from './provider'
import { createMemoryRateLimiter } from './rateLimit'
import type { RateLimiter } from './rateLimit'
import { bindingRunner, createWorkersAiProvider, restRunner } from './workersAi'
import type { AiBinding } from './workersAi'

/**
 * The assistant endpoint as a plain `Request` to `Response` function, so the same code runs in
 * the Vite dev server and in a Cloudflare Worker (or any platform with web-standard requests).
 * Secrets arrive only through `env`, on the server. Nothing here is bundled into the client.
 */

export interface AssistantEnv {
  /** Master switch. The assistant stays off unless this is exactly "true". */
  ASSISTANT_ENABLED?: string
  /** Which provider to use when both are set up: "cloudflare" (free tier) or "anthropic". */
  ASSISTANT_PROVIDER?: string
  /** Cloudflare Workers AI inside a Worker: the AI binding, which needs no key. */
  AI?: AiBinding
  /** Cloudflare Workers AI over REST (local development, or a host other than Cloudflare). */
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
  ANTHROPIC_API_KEY?: string
  /** Overrides the default model of whichever provider is used. */
  ASSISTANT_MODEL?: string
  /** Comma-separated extra origins allowed to call the endpoint. The site's own origin always is. */
  ASSISTANT_ALLOWED_ORIGINS?: string
  /** Requests per client per minute and per day, and requests per day across all clients. */
  ASSISTANT_RATE_PER_MINUTE?: string
  ASSISTANT_RATE_PER_DAY?: string
  ASSISTANT_DAILY_CAP?: string
}

export interface AssistantDeps {
  clientLimiter?: RateLimiter
  globalLimiter?: RateLimiter
  createProvider?: (env: AssistantEnv) => AssistantProvider | null
  now?: () => number
}

const REQUEST_TIMEOUT_MS = 20_000
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

const MESSAGES: Record<AssistantErrorCode, string> = {
  'not-configured': 'The assistant is not set up on this site.',
  'invalid-request': 'That request was not valid. Check the question and try again.',
  'too-large': 'That request was too large.',
  'forbidden-origin': 'This site is not allowed to use the assistant.',
  'rate-limited': 'Too many questions in a short time. Please wait a moment and try again.',
  'daily-limit': 'The assistant has reached its daily limit. Please try again tomorrow.',
  'provider-unavailable': 'The assistant is unavailable right now. Please try again in a moment.',
  refused: 'The assistant could not answer that question.',
  failed: 'Something went wrong while answering. Please try again.',
}

const STATUS: Record<AssistantErrorCode, number> = {
  'not-configured': 503,
  'invalid-request': 400,
  'too-large': 413,
  'forbidden-origin': 403,
  'rate-limited': 429,
  'daily-limit': 503,
  'provider-unavailable': 503,
  refused: 422,
  failed: 502,
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })
}

function fail(code: AssistantErrorCode, headers: Record<string, string> = {}): Response {
  return json({ error: { code, message: MESSAGES[code] } }, STATUS[code], headers)
}

/** The provider that would answer, or 
ull when none is set up. The free one wins by default. */
export function resolveProviderId(env: AssistantEnv): AssistantProviderId | null {
  const cloudflare =
    Boolean(env.AI) ||
    Boolean(env.CLOUDFLARE_ACCOUNT_ID?.trim() && env.CLOUDFLARE_API_TOKEN?.trim())
  const anthropic = Boolean(env.ANTHROPIC_API_KEY?.trim())
  const wanted = env.ASSISTANT_PROVIDER?.trim()
  if (wanted === 'anthropic') return anthropic ? 'anthropic' : null
  if (wanted === 'cloudflare') return cloudflare ? 'cloudflare' : null
  return cloudflare ? 'cloudflare' : anthropic ? 'anthropic' : null
}

export function isAssistantEnabled(env: AssistantEnv): boolean {
  return env.ASSISTANT_ENABLED?.trim() === 'true' && resolveProviderId(env) !== null
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Shared across requests in one running instance. Sized from the environment on first use. */
let defaultLimiters: { client: RateLimiter; global: RateLimiter } | undefined
function limitersFor(env: AssistantEnv) {
  defaultLimiters ??= {
    client: createMemoryRateLimiter([
      { windowMs: MINUTE, max: positiveInt(env.ASSISTANT_RATE_PER_MINUTE, 6) },
      { windowMs: DAY, max: positiveInt(env.ASSISTANT_RATE_PER_DAY, 40) },
    ]),
    global: createMemoryRateLimiter([
      { windowMs: DAY, max: positiveInt(env.ASSISTANT_DAILY_CAP, 300) },
    ]),
  }
  return defaultLimiters
}

/** For tests: forget the shared limiters. */
export function resetAssistantLimiters(): void {
  defaultLimiters = undefined
}

function defaultProvider(env: AssistantEnv): AssistantProvider | null {
  const id = resolveProviderId(env)
  if (id === 'anthropic') {
    return createAnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY?.trim() ?? '',
      model: env.ASSISTANT_MODEL,
    })
  }
  if (id === 'cloudflare') {
    const run = env.AI
      ? bindingRunner(env.AI)
      : restRunner({
          accountId: env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '',
          apiToken: env.CLOUDFLARE_API_TOKEN?.trim() ?? '',
        })
    return createWorkersAiProvider({ run, model: env.ASSISTANT_MODEL })
  }
  return null
}

/**
 * Who is asking. `cf-connecting-ip` is set by Cloudflare and cannot be forged by a visitor;
 * `x-forwarded-for` can be on a platform that does not overwrite it, so treat the limiter as a
 * best-effort guard there.
 */
function clientKey(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function originAllowed(request: Request, env: AssistantEnv): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = new Set([
    new URL(request.url).origin,
    ...(env.ASSISTANT_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ])
  return allowed.has(origin)
}

export async function handleAssistantRequest(
  request: Request,
  env: AssistantEnv,
  deps: AssistantDeps = {},
): Promise<Response> {
  const { method } = request

  if (method === 'GET') {
    // Lets the page say honestly whether the assistant exists, without exposing any setting.
    const enabled = isAssistantEnabled(env)
    return json(enabled ? { enabled, provider: resolveProviderId(env) } : { enabled })
  }
  if (method !== 'POST')
    return json({ error: { code: 'invalid-request', message: 'Method not allowed' } }, 405, {
      allow: 'GET, POST',
    })

  if (!isAssistantEnabled(env)) return fail('not-configured')
  if (!originAllowed(request, env)) return fail('forbidden-origin')

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > ASSISTANT_LIMITS.bodyBytes) return fail('too-large')

  const limiters = limitersFor(env)
  const now = deps.now?.() ?? Date.now()
  const client = (deps.clientLimiter ?? limiters.client).check(clientKey(request), now)
  if (!client.allowed)
    return fail('rate-limited', { 'retry-after': String(client.retryAfterSeconds) })
  const everyone = (deps.globalLimiter ?? limiters.global).check('all', now)
  if (!everyone.allowed)
    return fail('daily-limit', { 'retry-after': String(everyone.retryAfterSeconds) })

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return fail('invalid-request')
  }
  if (new TextEncoder().encode(raw).length > ASSISTANT_LIMITS.bodyBytes) return fail('too-large')

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return fail('invalid-request')
  }
  const parsed = assistantRequestSchema.safeParse(body)
  if (!parsed.success) return fail('invalid-request')

  const provider = (deps.createProvider ?? defaultProvider)(env)
  if (!provider) return fail('not-configured')

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
  try {
    const answer = await provider.answer({
      system: buildSystemPrompt(parsed.data.context),
      messages: parsed.data.messages,
      signal,
    })
    return json({ answer })
  } catch (error) {
    const failure = error instanceof ProviderError ? error.failure : 'failed'
    // Log the kind of failure only: never the key, the question or the forecast.
    console.error(`[assistant] provider failure: ${failure}`)
    switch (failure) {
      case 'refused':
        return fail('refused')
      case 'quota':
        return fail('daily-limit')
      case 'unavailable':
      case 'rate-limited':
      case 'misconfigured':
        // A rejected key is the owner's problem; visitors just see "unavailable".
        return fail('provider-unavailable')
      default:
        return fail('failed')
    }
  }
}
