import { LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { Location } from '../../domain/location'
import { useWeatherDataSource } from '../weather/WeatherDataSourceContext'
import styles from './UseMyLocationButton.module.css'

export interface UseMyLocationButtonProps {
  onLocated: (location: Location) => void
}

function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was blocked. Search for a city instead, or allow location access in your browser settings.'
    case error.TIMEOUT:
      return 'Finding your location took too long. Try again or search for a city.'
    default:
      return "Your location isn't available right now. Search for a city instead."
  }
}

/**
 * Optional "use my location". Only asks the browser when pressed; Atmos never prompts on its own
 * (OPEN_DECISIONS D-09). Coordinates are rounded to about 1 km before being stored.
 */
export function UseMyLocationButton({ onLocated }: UseMyLocationButtonProps) {
  const source = useWeatherDataSource()
  const [state, setState] = useState<'idle' | 'locating'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Device positions have no recorded data, so the button makes no sense in snapshot mode.
  if (source.kind === 'snapshot' || !('geolocation' in navigator)) return null

  function locate() {
    setError(null)
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState('idle')
        const latitude = Number(coords.latitude.toFixed(2))
        const longitude = Number(coords.longitude.toFixed(2))
        onLocated({ id: `geo:${latitude},${longitude}`, name: 'My location', latitude, longitude })
      },
      (failure) => {
        setState('idle')
        setError(describeGeolocationError(failure))
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }

  return (
    <div className={styles.wrapper}>
      <Button onClick={locate} disabled={state === 'locating'}>
        <LocateFixed size={18} aria-hidden="true" />
        {state === 'locating' ? 'Finding your location…' : 'Use my location'}
      </Button>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
