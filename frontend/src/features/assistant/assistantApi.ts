import {
  ASSISTANT_PATH,
  assistantAnswerSchema,
  assistantErrorSchema,
  assistantStatusSchema,
} from '../../lib/assistant/contract'
import type { AssistantErrorCode, AssistantRequest } from '../../lib/assistant/contract'

/**
 * How the browser talks to the assistant endpoint. The key is never here: the endpoint holds it.
 * The interface is what the UI depends on, so tests (or another transport) can replace it.
 */

export type AssistantStatus =
  /** The endpoint exists and is switched on. */
  | 'ready'
  /** There is no assistant on this site: the endpoint is missing or says it is off. */
  | 'not-configured'
  /** The endpoint could not be reached to find out. */
  | 'unreachable'

export interface AssistantService {
  getStatus(signal?: AbortSignal): Promise<AssistantStatus>
  ask(request: AssistantRequest, signal?: AbortSignal): Promise<string>
}

export class AssistantError extends Error {
  readonly code: AssistantErrorCode | 'network'
  /** Seconds to wait before trying again, when the server said so. */
  readonly retryAfterSeconds: number | undefined

  constructor(code: AssistantError['code'], message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'AssistantError'
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function createHttpAssistantService(
  options: { endpoint?: string; fetchImpl?: typeof fetch } = {},
): AssistantService {
  const endpoint = options.endpoint ?? ASSISTANT_PATH
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))

  return {
    async getStatus(signal) {
      let response: Response
      try {
        response = await doFetch(endpoint, { signal })
      } catch (error) {
        if (signal?.aborted) throw error
        return 'unreachable'
      }
      // A static site answers with 404 or with the app's own HTML page: there is no assistant.
      if (response.status === 404 || response.status === 405) return 'not-configured'
      if (!response.ok) return 'unreachable'
      try {
        const status = assistantStatusSchema.safeParse(await response.json())
        return status.success && status.data.enabled ? 'ready' : 'not-configured'
      } catch {
        return 'not-configured'
      }
    },

    async ask(request, signal) {
      let response: Response
      try {
        response = await doFetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
          signal,
        })
      } catch (error) {
        if (signal?.aborted) throw error
        throw new AssistantError('network', 'Could not reach the assistant.')
      }

      let body: unknown
      try {
        body = await response.json()
      } catch {
        throw new AssistantError('failed', 'The assistant sent a reply that could not be read.')
      }

      if (response.ok) {
        const answer = assistantAnswerSchema.safeParse(body)
        if (answer.success) return answer.data.answer
        throw new AssistantError('failed', 'The assistant sent a reply that could not be read.')
      }

      const error = assistantErrorSchema.safeParse(body)
      const retryAfter = Number(response.headers.get('retry-after'))
      throw new AssistantError(
        error.success ? error.data.error.code : 'failed',
        error.success ? error.data.error.message : 'Something went wrong while answering.',
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      )
    },
  }
}

/** What to tell the person, and whether asking again could help. */
export function describeAssistantError(error: unknown): { message: string; retryable: boolean } {
  if (error instanceof AssistantError) {
    switch (error.code) {
      case 'network':
        return { message: 'Could not reach the assistant. Check your connection.', retryable: true }
      case 'rate-limited':
        return {
          message: error.retryAfterSeconds
            ? `Too many questions. Try again in about ${error.retryAfterSeconds} seconds.`
            : error.message,
          retryable: true,
        }
      case 'provider-unavailable':
      case 'failed':
        return { message: error.message, retryable: true }
      case 'refused':
      case 'invalid-request':
      case 'too-large':
        return { message: error.message, retryable: false }
      case 'not-configured':
      case 'forbidden-origin':
        return { message: error.message, retryable: false }
    }
  }
  return { message: 'Something went wrong while answering.', retryable: true }
}
