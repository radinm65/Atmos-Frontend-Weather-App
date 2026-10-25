import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ChooseLocationPrompt } from '../locations/ChooseLocationPrompt'
import { useActiveLocation } from '../locations/useActiveLocation'
import { WeatherQueryState } from '../weather/WeatherQueryState'
import { AssistantChat } from './AssistantChat'
import styles from './AssistantPage.module.css'
import { useAssistantStatus } from './useAssistant'

export function AssistantPage() {
  useDocumentTitle('Assistant')
  const { activeLocation } = useActiveLocation()
  const status = useAssistantStatus()

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.heading}>Assistant</h1>
        <p className={styles.intro}>
          Ask plain-language questions about the weather for your selected city. Answers come from
          the forecast on screen, not from guesses.
        </p>
      </div>

      {status.isPending ? (
        <LoadingState label="Checking the assistant" lines={2} />
      ) : status.data === 'not-configured' ? (
        <NotConfigured />
      ) : status.data === 'unreachable' || status.isError ? (
        <ErrorState
          title="Can't reach the assistant"
          message="The assistant service did not answer. The rest of Atmos still works."
          onRetry={() => void status.refetch()}
        />
      ) : activeLocation ? (
        <WeatherQueryState location={activeLocation}>
          {(report, freshness) => (
            <AssistantChat key={report.location.id} report={report} freshness={freshness} />
          )}
        </WeatherQueryState>
      ) : (
        <ChooseLocationPrompt />
      )}
    </div>
  )
}

/** Shown when this copy of the site has no AI behind it. Plain and honest: nothing is faked. */
function NotConfigured() {
  return (
    <GlassPanel
      as="section"
      strong
      interactive={false}
      className={styles.off}
      aria-labelledby="assistant-off"
    >
      <Sparkles size={40} aria-hidden="true" className={styles.offIcon} />
      <h2 id="assistant-off" className={styles.offTitle}>
        The assistant is not switched on
      </h2>
      <p className={styles.offText}>
        Atmos can answer weather questions with an AI model, but this copy of the site runs without
        one, so there is nothing to ask. Everything else works as normal.
      </p>
      <p className={styles.offLinks}>
        <Link to="/">Overview</Link> · <Link to="/forecast">Forecast</Link> ·{' '}
        <Link to="/compare">Compare</Link> · <Link to="/map">Map</Link>
      </p>
      <p className={styles.offOwner}>
        Site owner: the assistant needs an AI account key and ASSISTANT_ENABLED=true on the server.
        See the project README.
      </p>
    </GlassPanel>
  )
}
