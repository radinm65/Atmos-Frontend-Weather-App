import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { WeatherReport } from '../../domain/weather'
import { useUnits } from '../preferences/useUnits'
import { hoursFromNow } from '../weather/selectors'
import { summarizeWindRows, toChartRows } from './chartData'
import type { ChartRow } from './chartData'
import styles from './HourlyChart.module.css'

const HOURS = 24

interface TooltipProps {
  active?: boolean
  payload?: readonly { payload?: ChartRow }[]
  unitLabel: string
}

function WindTooltip({ active, payload, unitLabel }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const w = (v: number | null) => (v === null ? '—' : `${Math.round(v)} ${unitLabel}`)
  return (
    <div className={`glass-strong ${styles.tooltip}`}>
      <strong>{row.label}</strong>
      <span>Wind {w(row.windSpeed)}</span>
      <span>Gusts {w(row.windGusts)}</span>
    </div>
  )
}

/** The next 24 hours of wind speed and gusts. */
export default function WindChart({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const unitLabel = units.windSpeed === 'mph' ? 'mph' : 'km/h'
  const rows = toChartRows(
    hoursFromNow(report, HOURS),
    report.timezone,
    units.temperature,
    units.windSpeed,
  )
  const summary = summarizeWindRows(rows, unitLabel)

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="wind-title"
    >
      <h2 id="wind-title" className={styles.title}>
        24-hour wind
      </h2>
      <div className={styles.chartShort} role="img" aria-label={`Wind chart. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="wind-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--chart-wind)', stopOpacity: 0.55 }} />
                <stop offset="100%" style={{ stopColor: 'var(--chart-wind)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
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
              domain={[0, 'dataMax + 5']}
              tickFormatter={(value: number) => String(Math.round(value))}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-text-muted)', strokeDasharray: '4 4' }}
              content={<WindTooltip unitLabel={unitLabel} />}
            />
            <Area
              dataKey="windSpeed"
              type="monotone"
              stroke="var(--chart-wind)"
              strokeWidth={3}
              fill="url(#wind-fill)"
              connectNulls
              isAnimationActive
              animationDuration={1300}
            />
            <Line
              dataKey="windGusts"
              type="monotone"
              stroke="var(--color-text)"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={1300}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.summary}>{summary}</p>
    </GlassPanel>
  )
}
