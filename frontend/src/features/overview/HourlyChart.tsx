import {
  Area,
  Bar,
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
import { summarizeTemperatureRows, toChartRows } from './chartData'
import type { ChartRow } from './chartData'
import styles from './HourlyChart.module.css'

const HOURS = 24

interface TooltipProps {
  active?: boolean
  payload?: readonly { payload?: ChartRow }[]
  unitSymbol: string
}

function ChartTooltip({ active, payload, unitSymbol }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const t = (v: number | null) => (v === null ? '—' : `${Math.round(v)}${unitSymbol}`)
  return (
    <div className={`glass-strong ${styles.tooltip}`}>
      <strong>{row.label}</strong>
      <span>Temperature {t(row.temperature)}</span>
      <span>Feels like {t(row.feelsLike)}</span>
      <span>Chance of rain {row.rainChance === null ? '—' : `${Math.round(row.rainChance)}%`}</span>
    </div>
  )
}

/** The next 24 hours as an interactive chart: temperature area, feels-like line, rain-chance bars. */
export default function HourlyChart({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const unitSymbol = '°'
  const rows = toChartRows(hoursFromNow(report, HOURS), report.timezone, units.temperature)
  const summary = summarizeTemperatureRows(rows, unitSymbol)

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="trend-title"
    >
      <h2 id="trend-title" className={styles.title}>
        24-hour trend
      </h2>
      <div className={styles.chart} role="img" aria-label={`Temperature chart. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--chart-temp)', stopOpacity: 0.6 }} />
                <stop offset="100%" style={{ stopColor: 'var(--chart-temp)', stopOpacity: 0 }} />
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
              yAxisId="temp"
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value: number) => `${Math.round(value)}${unitSymbol}`}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis yAxisId="rain" orientation="right" domain={[0, 100]} hide />
            <Tooltip
              cursor={{ stroke: 'var(--color-text-muted)', strokeDasharray: '4 4' }}
              content={<ChartTooltip unitSymbol={unitSymbol} />}
            />
            <Bar
              yAxisId="rain"
              dataKey="rainChance"
              fill="var(--chart-rain)"
              fillOpacity={0.4}
              radius={[4, 4, 0, 0]}
              barSize={10}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              yAxisId="temp"
              dataKey="temperature"
              type="monotone"
              stroke="var(--chart-temp)"
              strokeWidth={3}
              fill="url(#temp-fill)"
              connectNulls
              isAnimationActive
              animationDuration={1300}
            />
            <Line
              yAxisId="temp"
              dataKey="feelsLike"
              type="monotone"
              stroke="var(--chart-feels)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
              isAnimationActive
              animationDuration={1300}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.summary}>{summary}</p>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={styles.swatchTemp} /> Temperature
        </li>
        <li>
          <span className={styles.swatchFeels} /> Feels like
        </li>
        <li>
          <span className={styles.swatchRain} /> Chance of rain
        </li>
      </ul>
    </GlassPanel>
  )
}
