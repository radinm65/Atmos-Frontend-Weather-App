import { z } from 'zod'

/**
 * The wire format between the browser and the assistant endpoint, shared by both sides so they
 * cannot drift. The endpoint never trusts the browser: it validates every request against these
 * schemas, with limits that also cap what one request can cost.
 */

export const ASSISTANT_PATH = '/api/assistant'

export const ASSISTANT_LIMITS = {
  /** Characters in one question typed by the person. */
  questionChars: 500,
  /** Characters in any one message of the conversation sent along as history. */
  messageChars: 1500,
  /** Messages sent per request (the newest ones, ending with the question). */
  historyMessages: 7,
  placeNameChars: 120,
  /** Characters of forecast text that go with a question. */
  contextChars: 8000,
  /** Raw request body size in bytes. */
  bodyBytes: 32_000,
} as const

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(ASSISTANT_LIMITS.messageChars),
})

export const assistantRequestSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(ASSISTANT_LIMITS.historyMessages),
    context: z.object({
      placeName: z.string().trim().min(1).max(ASSISTANT_LIMITS.placeNameChars),
      text: z.string().trim().min(1).max(ASSISTANT_LIMITS.contextChars),
    }),
  })
  .refine((request) => request.messages[0]?.role === 'user', {
    message: 'The conversation must start with a question',
    path: ['messages'],
  })
  .refine((request) => request.messages.at(-1)?.role === 'user', {
    message: 'The conversation must end with a question',
    path: ['messages'],
  })

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type AssistantRequest = z.infer<typeof assistantRequestSchema>

export type AssistantErrorCode =
  /** No API key or the feature is switched off. */
  | 'not-configured'
  | 'invalid-request'
  | 'too-large'
  | 'forbidden-origin'
  | 'rate-limited'
  /** The AI provider is down, overloaded, or took too long. */
  | 'provider-unavailable'
  /** The provider declined to answer this request. */
  | 'refused'
  /** Anything else on the server side. */
  | 'failed'

export const assistantErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      'not-configured',
      'invalid-request',
      'too-large',
      'forbidden-origin',
      'rate-limited',
      'provider-unavailable',
      'refused',
      'failed',
    ]),
    message: z.string(),
  }),
})

export const assistantAnswerSchema = z.object({ answer: z.string().min(1) })
export const assistantStatusSchema = z.object({ enabled: z.boolean() })
