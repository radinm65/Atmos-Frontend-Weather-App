import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { Location } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import { formatTime } from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import { buildCompareChart } from './comparison'
import type { CompareChartRow, CompareChartSeries } from './comparison'
import styles from './ComparisonChart.module.css'
import { seriesStyle } from './seriesStyle'

interface TooltipProps {
  active?: boolean
  payload?: readonly { payload?: CompareChartRow }[]
  series: readonly CompareChartSeries[]
}

function CompareTooltip({ active, payload, series }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className={`glass-strong ${styles.tooltip}`}>
      <strong>{row.label}</strong>
      {series.map((item, index) => {
        const value = row[item.key]
        const time = row[`${item.key}-time`]
        return (
          <span key={item.key}>
            <i style={{ background: seriesStyle(index).color }} aria-hidden="true" /> {item.name}{' '}
            {typeof value === 'number' ? `${Math.round(value)}°` : '—'}
            {typeof time === 'string' ? ` (${time} local)` : ''}
          </span>
        )
      })}
    </div>
  )
}

export interface ComparisonChartProps {
  cities: readonly Location[]
  reports: readonly (WeatherReport | null)[]
}

/** Temperature for every city over the next 24 hours, aligned by real elapsed time. */
export default function ComparisonChart({ cities, reports }: ComparisonChartProps) {
  const units = useUnits()
  const { series, rows } = buildCompareChart(cities, reports, units, formatTime)
  const first = rows[0]
  const nowText = series
    .map((item) => {
      const value = first?.[item.key]
      return `${item.name} ${typeof value === 'number' ? `${Math.round(value)}°` : 'unavailable'}`
    })
    .join(', ')
  const summary = `Temperature over the next 24 hours. Right now: ${nowText}.`

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="cmp-chart-title"
    >
      <h2 id="cmp-chart-title" className={styles.title}>
        Next 24 hours
      </h2>
      <div className={styles.chart} role="img" aria-label={`Comparison chart. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              interval={3}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value: number) => `${Math.round(value)}°`}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-text-muted)', strokeDasharray: '4 4' }}
              content={<CompareTooltip series={series} />}
            />
            {series.map((item, index) => (
              <Line
                key={item.key}
                dataKey={item.key}
                name={item.name}
                type="monotone"
                stroke={seriesStyle(index).color}
                strokeDasharray={seriesStyle(index).dash || undefined}
                strokeWidth={3}
                dot={false}
                connectNulls
                isAnimationActive
                animationDuration={1200}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.summary}>{summary}</p>
      <ul className={styles.legend} aria-hidden="true">
        {series.map((item, index) => (
          <li key={item.key}>
            <svg width="30" height="8" viewBox="0 0 30 8">
              <line
                x1="0"
                x2="30"
                y1="4"
                y2="4"
                stroke={seriesStyle(index).color}
                strokeWidth="3"
                strokeDasharray={seriesStyle(index).dash || undefined}
                strokeLinecap="round"
              />
            </svg>
            {item.name}
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        Hours are counted from now, so every city is compared at the same moment. Hover a point to
        see each city&apos;s own local time.
      </p>
    </GlassPanel>
  )
}
