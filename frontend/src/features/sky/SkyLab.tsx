import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { WeatherCondition } from '../../domain/weather'
import { SkyScene } from './SkyScene'
import styles from './SkyLab.module.css'
import { computeSkyState } from './skyState'

/**
 * DEVELOPMENT ONLY (route exists only in dev builds). A workbench for tuning the sky across the
 * day and every weather type. It shows invented inputs on purpose and is not a weather page.
 */

const CONDITIONS: Record<string, WeatherCondition> = {
  clear: { category: 'clear', label: 'Clear sky', code: 0 },
  partly: { category: 'partly-cloudy', label: 'Partly cloudy', code: 2 },
  overcast: { category: 'overcast', label: 'Overcast', code: 3 },
  fog: { category: 'fog', label: 'Fog', code: 45 },
  drizzle: { category: 'rain', label: 'Light rain', code: 61 },
  rain: { category: 'rain', label: 'Heavy rain', code: 65 },
  snow: { category: 'snow', label: 'Snow', code: 73 },
  storm: { category: 'thunderstorm', label: 'Thunderstorm', code: 95 },
  unknown: { category: 'unknown', label: 'Conditions unavailable', code: null },
}

const DAY = '2026-10-24'
const SUNRISE = `${DAY}T06:30:00.000Z`
const SUNSET = `${DAY}T18:30:00.000Z`

function numberParam(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return value !== null && Number.isFinite(parsed) ? parsed : fallback
}

function clockTime(hours: number): string {
  const minutes = Math.round(hours * 60)
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function SkyLab() {
  const [params, setParams] = useSearchParams()
  const hour = numberParam(params.get('hour'), 12)
  const cloud = numberParam(params.get('cloud'), 20)
  const wind = numberParam(params.get('wind'), 15)
  const conditionKey = params.get('cond') ?? 'clear'
  const condition = CONDITIONS[conditionKey] ?? CONDITIONS.clear!

  const time = `${DAY}T${clockTime(hour)}:00.000Z`
  const state = useMemo(
    () =>
      computeSkyState({
        time,
        timezone: 'UTC',
        sunrise: SUNRISE,
        sunset: SUNSET,
        previousSunset: '2026-10-23T18:31:00.000Z',
        nextSunrise: '2026-10-25T06:29:00.000Z',
        isDay: null,
        condition,
        cloudCover: cloud,
        windSpeed: wind,
      }),
    [time, condition, cloud, wind],
  )

  const update = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set(key, value)
      return next
    })

  return (
    <div className={styles.lab}>
      <h1 className={styles.title}>Sky lab (development only)</h1>
      <p className={styles.note}>
        Invented inputs for tuning the sky. This is not weather data for any place.
      </p>

      <div className={styles.stage}>
        <SkyScene state={state} />
        <p className={styles.readout}>
          {clockTime(hour)} · {condition.label} · sun altitude {state.altitude.toFixed(2)}
        </p>
      </div>

      <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
        <label>
          Time of day ({clockTime(hour)}; sunrise 06:30, sunset 18:30)
          <input
            type="range"
            min={0}
            max={24}
            step={0.25}
            value={hour}
            onChange={(event) => update('hour', event.target.value)}
          />
        </label>
        <label>
          Condition
          <select value={conditionKey} onChange={(event) => update('cond', event.target.value)}>
            {Object.entries(CONDITIONS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cloud cover ({cloud}%)
          <input
            type="range"
            min={0}
            max={100}
            value={cloud}
            onChange={(event) => update('cloud', event.target.value)}
          />
        </label>
        <label>
          Wind ({wind} km/h)
          <input
            type="range"
            min={0}
            max={80}
            value={wind}
            onChange={(event) => update('wind', event.target.value)}
          />
        </label>
      </form>
    </div>
  )
}
