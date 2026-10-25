import { Send, Sparkles, TriangleAlert, User } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { WeatherReport } from '../../domain/weather'
import { ASSISTANT_LIMITS } from '../../lib/assistant/contract'
import type { ChatMessage } from '../../lib/assistant/contract'
import { useUnits } from '../preferences/useUnits'
import { describeAssistantError } from './assistantApi'
import styles from './AssistantChat.module.css'
import { EMERGENCY_NOTICE, looksLikeEmergency } from './emergency'
import { assistantService } from './useAssistant'
import { buildAssistantContext } from './weatherContext'

const SUGGESTIONS = [
  'Do I need an umbrella today?',
  'What should I wear this evening?',
  'When is the best time for a walk tomorrow?',
  'Will it be windy this weekend?',
]

interface Turn extends ChatMessage {
  id: number
  /** The question sounded like an emergency, so the app shows its own fixed safety notice. */
  emergency?: boolean
}

export interface AssistantChatProps {
  report: WeatherReport
  /** "How current is this forecast" label from the weather query. */
  freshness: ReactNode
}

/**
 * The conversation. It lives only in this component: nothing is stored, and changing the place
 * starts a new one. Each question is sent with the forecast shown on the page, so answers are
 * grounded in what the person can see.
 */
export function AssistantChat({ report, freshness }: AssistantChatProps) {
  const units = useUnits()
  const inputId = useId()
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<{ message: string; retryable: boolean } | null>(null)
  const nextId = useRef(1)
  const abort = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const placeName = report.location.name

  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [turns, pending, problem])

  async function send(history: readonly Turn[]) {
    // The newest messages that fit, starting with a question (the endpoint requires it).
    const recent = history.slice(-ASSISTANT_LIMITS.historyMessages)
    const messages: ChatMessage[] = recent
      .slice(recent.findIndex((turn) => turn.role === 'user'))
      .map(({ role, content }) => ({ role, content }))

    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setPending(true)
    setProblem(null)
    try {
      const answer = await assistantService.ask(
        { messages, context: buildAssistantContext(report, units) },
        controller.signal,
      )
      setTurns((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: answer },
      ])
    } catch (error) {
      if (controller.signal.aborted) return
      setProblem(describeAssistantError(error))
    } finally {
      if (abort.current === controller) setPending(false)
    }
  }

  function ask(question: string) {
    const content = question.trim()
    if (!content || pending) return
    const turn: Turn = {
      id: nextId.current++,
      role: 'user',
      content,
      emergency: looksLikeEmergency(content),
    }
    const history = [...turns, turn]
    setTurns(history)
    setDraft('')
    void send(history)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    ask(draft)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      ask(draft)
    }
  }

  function clear() {
    abort.current?.abort()
    setTurns([])
    setProblem(null)
    setPending(false)
  }

  const remaining = ASSISTANT_LIMITS.questionChars - draft.length

  return (
    <GlassPanel
      as="section"
      strong
      interactive={false}
      className={styles.chat}
      aria-label={`Chat about the weather in ${placeName}`}
    >
      <header className={styles.header}>
        <p className={styles.scope}>
          Answers use the forecast for <strong>{placeName}</strong>
        </p>
        <div className={styles.meta}>
          {freshness}
          {turns.length > 0 ? (
            <Button variant="ghost" onClick={clear}>
              Clear conversation
            </Button>
          ) : null}
        </div>
      </header>

      <div className={styles.log} role="log" aria-label="Conversation" aria-live="polite">
        {turns.length === 0 ? (
          <div className={styles.empty}>
            <Sparkles size={32} aria-hidden="true" className={styles.emptyIcon} />
            <p>Ask about the weather in {placeName}. For example:</p>
            <ul className={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    className={styles.suggestion}
                    disabled={pending}
                    onClick={() => ask(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((turn) => (
            <div key={turn.id} className={styles.turn} data-role={turn.role}>
              <article className={styles.bubble} data-role={turn.role}>
                <span className={styles.who}>
                  {turn.role === 'user' ? (
                    <User size={14} aria-hidden="true" />
                  ) : (
                    <Sparkles size={14} aria-hidden="true" />
                  )}
                  {turn.role === 'user' ? 'You' : 'Assistant'}
                </span>
                {turn.content.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </article>
              {turn.emergency ? (
                <p className={styles.emergency} role="note">
                  <TriangleAlert size={16} aria-hidden="true" /> {EMERGENCY_NOTICE}
                </p>
              ) : null}
            </div>
          ))
        )}

        {pending ? (
          <div className={styles.turn} data-role="assistant">
            <p className={styles.thinking} role="status">
              <span className={styles.dots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              Thinking…
            </p>
          </div>
        ) : null}

        {problem ? (
          <div className={styles.problem} role="alert">
            <p>{problem.message}</p>
            {problem.retryable ? (
              <Button variant="secondary" onClick={() => void send(turns)}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <label htmlFor={inputId} className={styles.label}>
          Ask about the weather in {placeName}
        </label>
        <div className={styles.inputRow}>
          <textarea
            id={inputId}
            className={styles.input}
            rows={2}
            maxLength={ASSISTANT_LIMITS.questionChars}
            value={draft}
            placeholder="e.g. Do I need a jacket tonight?"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button type="submit" variant="primary" disabled={pending || draft.trim() === ''}>
            <Send size={16} aria-hidden="true" />
            Send
          </Button>
        </div>
        <p className={styles.counter} aria-live="off">
          {remaining} characters left. Enter sends, Shift+Enter adds a line.
        </p>
      </form>

      <p className={styles.fine}>
        AI answers can be wrong. They use only the forecast above, so check anything important with
        an official source, and for warnings or emergencies follow your local authorities. Your
        question and this forecast are sent to our server and to the AI provider (Anthropic) to
        write the answer. Nothing is stored.
      </p>
    </GlassPanel>
  )
}
