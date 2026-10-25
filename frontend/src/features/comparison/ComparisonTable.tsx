import { ArrowDown, ArrowUp } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { Location } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import { useUnits } from '../preferences/useUnits'
import { buildCompareRows } from './comparison'
import styles from './ComparisonTable.module.css'
import { seriesStyle } from './seriesStyle'

export interface ComparisonTableProps {
  cities: readonly Location[]
  reports: readonly (WeatherReport | null)[]
}

/**
 * The same measurements for every city, in the same units. Highest and lowest are marked with an
 * arrow and a word, not by colour alone. A city still loading (or failed) shows dashes.
 */
export function ComparisonTable({ cities, reports }: ComparisonTableProps) {
  const units = useUnits()
  const rows = buildCompareRows(reports, units)

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="table-title"
    >
      <h2 id="table-title" className={styles.title}>
        Side by side
      </h2>
      {/* Scrollable regions must be keyboard-focusable so keyboard users can scroll them. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className={styles.scroll} tabIndex={0} role="region" aria-labelledby="table-title">
        <table className={styles.table}>
          <caption className="visually-hidden">
            Weather comparison. Current values are as observed in each city, in your chosen units.
          </caption>
          <thead>
            <tr>
              <th scope="col">Measurement</th>
              {cities.map((city, index) => (
                <th scope="col" key={city.id}>
                  <span
                    className={styles.swatch}
                    style={{ background: seriesStyle(index).color }}
                    aria-hidden="true"
                  />
                  {city.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, index) => (
                  <td key={cities[index]?.id ?? index} data-mark={cell.mark ?? undefined}>
                    <span className={styles.value}>
                      {cell.text === '—' ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="visually-hidden">not available</span>
                        </>
                      ) : (
                        cell.text
                      )}
                    </span>
                    {cell.mark === 'highest' ? (
                      <span className={styles.mark}>
                        <ArrowUp size={14} aria-hidden="true" />
                        <span className="visually-hidden">highest</span>
                      </span>
                    ) : null}
                    {cell.mark === 'lowest' ? (
                      <span className={styles.mark}>
                        <ArrowDown size={14} aria-hidden="true" />
                        <span className="visually-hidden">lowest</span>
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}
