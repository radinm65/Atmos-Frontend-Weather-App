import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '../../src/lib/assistant/contract'

/**
 * The assistant's runtime AI provider, behind a small interface so another provider can replace
 * Anthropic without touching the handler or the UI (TRD §7).
 */

export type ProviderFailure =
  /** Could not reach the provider, it is overloaded, or it timed out. Worth trying again. */
  | 'unavailable'
  | 'rate-limited'
  /** The key is wrong or the account has a problem. The owner must act; never shown in detail. */
  | 'misconfigured'
  /** The provider declined to answer. */
  | 'refused'
  | 'failed'

export class ProviderError extends Error {
  readonly failure: ProviderFailure
  constructor(failure: ProviderFailure, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ProviderError'
    this.failure = failure
  }
}

export interface AssistantProvider {
  readonly model: string
  answer(input: {
    system: string
    messages: readonly ChatMessage[]
    signal: AbortSignal
  }): Promise<string>
}

/** Haiku-class: fast and cheap, and plenty for answering from a small supplied forecast. */
export const DEFAULT_MODEL = 'claude-haiku-5-5'
/** A hard ceiling on one answer. Answers are asked to be short; this caps the cost of one call. */
const MAX_OUTPUT_TOKENS = 1024

/** The part of the SDK client this module uses, so tests can supply a fake. */
export interface MessagesClient {
  messages: { create: Anthropic['messages']['create'] }
}

export function createAnthropicProvider(options: {
  apiKey: string
  model?: string
  client?: MessagesClient
}): AssistantProvider {
  const model = options.model?.trim() || DEFAULT_MODEL
  // The SDK retries transient errors once; the handler enforces the overall time limit.
  const client: MessagesClient =
    options.client ?? new Anthropic({ apiKey: options.apiKey, maxRetries: 1 })

  return {
    model,
    async answer({ system, messages, signal }) {
      let response
      try {
        response = await client.messages.create(
          {
            model,
            max_tokens: MAX_OUTPUT_TOKENS,
            system,
            messages: messages.map(({ role, content }) => ({ role, content })),
            // Answering from a short supplied forecast needs little deliberation.
            output_config: { effort: 'low' },
          },
          { signal },
        )
      } catch (error) {
        throw toProviderError(error, signal)
      }

      if (response.stop_reason === 'refusal') {
        throw new ProviderError('refused', 'The provider declined to answer')
      }
      const text = response.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('\n')
        .trim()
      if (!text) throw new ProviderError('failed', 'The provider returned no text')
      return text
    },
  }
}

function toProviderError(error: unknown, signal: AbortSignal): ProviderError {
  if (signal.aborted)
    return new ProviderError('unavailable', 'The provider timed out', { cause: error })
  const status =
    typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined
  if (status === 401 || status === 403 || status === 402) {
    return new ProviderError('misconfigured', 'The provider rejected the credentials', {
      cause: error,
    })
  }
  if (status === 429)
    return new ProviderError('rate-limited', 'The provider is rate limiting', { cause: error })
  if (typeof status === 'number' && status >= 500) {
    return new ProviderError('unavailable', 'The provider had a problem', { cause: error })
  }
  if (status === undefined) {
    // No HTTP status means the request never completed (network or timeout inside the SDK).
    return new ProviderError('unavailable', 'The provider could not be reached', { cause: error })
  }
  return new ProviderError('failed', 'The provider rejected the request', { cause: error })
}
