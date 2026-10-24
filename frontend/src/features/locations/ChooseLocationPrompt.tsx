import { Compass } from 'lucide-react'
import styles from './ChooseLocationPrompt.module.css'
import { LocationSearch } from './LocationSearch'
import { UseMyLocationButton } from './UseMyLocationButton'
import { useActiveLocation } from './useActiveLocation'
import { useWeatherDataSource } from '../weather/WeatherDataSourceContext'

/** First-run state (OPEN_DECISIONS D-09): search first, with an optional "use my location". */
export function ChooseLocationPrompt() {
  const { setActiveLocation } = useActiveLocation()
  const source = useWeatherDataSource()

  return (
    <section className={styles.prompt} aria-labelledby="choose-location-heading">
      <Compass size={32} aria-hidden="true" className={styles.icon} />
      <h2 id="choose-location-heading" className={styles.title}>
        Choose a location
      </h2>
      <p className={styles.text}>
        {source.kind === 'snapshot'
          ? 'Search for one of the places with recorded weather data.'
          : 'Search for a city to see its weather. Atmos remembers your choice in this browser.'}
      </p>
      <div className={styles.search}>
        <LocationSearch onSelect={setActiveLocation} />
      </div>
      <UseMyLocationButton onLocated={setActiveLocation} />
    </section>
  )
}
