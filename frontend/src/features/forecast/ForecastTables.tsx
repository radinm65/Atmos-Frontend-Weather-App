import { Value } from '../../components/ui/Value'
import type { WeatherReport } from '../../domain/weather'
import {
  formatLocalDate,
  formatPercent,
  formatPrecipitation,
  formatTemperature,
  formatTime,
} from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import styles from './ForecastTables.module.css'
import { selectHours } from './selectHours'

const HOURS_SHOWN = 24

/**
 * Plain, accessible forecast tables. Charts and the polished layout arrive in Phase 3. Times are
 * in the location's time zone, and the day count reflects what the provider actually returned.
 */
export function ForecastTables({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const { timezone } = report
  const hours = selectHours(report.hourly, report.current.observedAt, HOURS_SHOWN)

  return (
    <>
      <section aria-labelledby="hourly-heading" className={styles.section}>
        <h2 id="hourly-heading" className={styles.heading}>
          Hourly data table
        </h2>
        {/* Scrollable regions must be keyboard-focusable so keyboard users can scroll them. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className={styles.scroll} tabIndex={0} role="region" aria-labelledby="hourly-heading">
          <table className={styles.table}>
            <caption className="visually-hidden">Hourly forecast, times in {timezone}</caption>
            <thead>
              <tr>
                <th scope="col">Time ({timezone})</th>
                <th scope="col">Conditions</th>
                <th scope="col">Temperature</th>
                <th scope="col">Chance of rain</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour.time}>
                  <th scope="row">{formatTime(hour.time, timezone)}</th>
                  <td>{hour.condition?.label ?? <Value text="—" />}</td>
                  <td>
                    <Value text={formatTemperature(hour.temperature, units.temperature)} />
                  </td>
                  <td>
                    <Value text={formatPercent(hour.precipitationProbability)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="daily-heading" className={styles.section}>
        <h2 id="daily-heading" className={styles.heading}>
          Daily data table
        </h2>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className={styles.scroll} tabIndex={0} role="region" aria-labelledby="daily-heading">
          <table className={styles.table}>
            <caption className="visually-hidden">Daily forecast for {report.location.name}</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Conditions</th>
                <th scope="col">High</th>
                <th scope="col">Low</th>
                <th scope="col">Chance of rain</th>
                <th scope="col">Precipitation</th>
              </tr>
            </thead>
            <tbody>
              {report.daily.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{formatLocalDate(day.date)}</th>
                  <td>{day.condition?.label ?? <Value text="—" />}</td>
                  <td>
                    <Value text={formatTemperature(day.maxTemperature, units.temperature)} />
                  </td>
                  <td>
                    <Value text={formatTemperature(day.minTemperature, units.temperature)} />
                  </td>
                  <td>
                    <Value text={formatPercent(day.precipitationProbability)} />
                  </td>
                  <td>
                    <Value text={formatPrecipitation(day.precipitationSum)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
