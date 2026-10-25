import { Droplets, Gauge, Sun, Thermometer, Umbrella, Wind } from 'lucide-react'
import { useState } from 'react'
import type { ReactElement } from 'react'
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
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import type { SegmentOption } from '../../components/ui/SegmentedControl'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { WeatherReport } from '../../domain/weather'
import { formatUv } from '../../lib/formatting'
import {
  summarizeSeries,
  summarizeTemperatureRows,
  summarizeWindRows,
  toChartRows,
} from '../overview/chartData'
import type { ChartRow } from '../overview/chartData'
import { useUnits } from '../preferences/useUnits'
import { hoursFromNow } from '../weather/selectors'
import styles from './ForecastExplorer.module.css'

type MetricId = 'temperature' | 'rain' | 'wind' | 'uv' | 'humidity' | 'pressure'
type RangeId = '24' | '48' | '168'

const METRICS: readonly SegmentOption<MetricId>[] = [
  { id: 'temperature', label: 'Temperature', icon: <Thermometer size={16} /> },
  { id: 'rain', label: 'Rain', icon: <Umbrella size={16} /> },
  { id: 'wind', label: 'Wind', icon: <Wind size={16} /> },
  { id: 'uv', label: 'UV', icon: <Sun size={16} /> },
  { id: 'humidity', label: 'Humidity', icon: <Droplets size={16} /> },
  { id: 'pressure', label: 'Pressure', icon: <Gauge size={16} /> },
]

const RANGES: readonly SegmentOption<RangeId>[] = [
  { id: '24', label: '24 h' },
  { id: '48', label: '48 h' },
  { id: '168', label: '7 days' },
]

interface SeriesLine {
  name: string
  value: string
  color: string
}

interface TooltipProps {
  active?: boolean
  payload?: readonly { payload?: ChartRow }[]
  describe: (row: ChartRow) => SeriesLine[]
}

function ExplorerTooltip({ active, payload, describe }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className={`glass-strong ${styles.tooltip}`}>
      <strong>{row.label}</strong>
      {describe(row).map((line) => (
        <span key={line.name}>
          <i style={{ background: line.color }} aria-hidden="true" /> {line.name} {line.value}
        </span>
      ))}
    </div>
  )
}

const dash = (value: number | null, format: (n: number) => string) =>
  value === null ? '—' : format(value)

export default function ForecastExplorer({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const [metric, setMetric] = useState<MetricId>('temperature')
  const [range, setRange] = useState<RangeId>('48')

  const count = Number(range)
  const rows = toChartRows(
    hoursFromNow(report, count),
    report.timezone,
    units.temperature,
    units.windSpeed,
    count > 24,
  )
  const degree = (n: number) => `${Math.round(n)}°`
  const windUnit = units.windSpeed === 'mph' ? 'mph' : 'km/h'
  const tickInterval = count <= 24 ? 3 : count <= 48 ? 7 : 23

  // Each metric supplies its series, axis formatting, tooltip lines and a text summary.
  let series: ReactElement[]
  let tickFormat: (n: number) => string = (n) => String(Math.round(n))
  let domain: [number | string, number | string] = ['auto', 'auto']
  let summary: string
  let describe: (row: ChartRow) => SeriesLine[]
  let color: string

  switch (metric) {
    case 'temperature':
      color = 'var(--chart-temp)'
      tickFormat = degree
      domain = ['dataMin - 2', 'dataMax + 2']
      summary = summarizeTemperatureRows(rows, '°')
      describe = (row) => [
        { name: 'Temperature', value: dash(row.temperature, degree), color },
        { name: 'Feels like', value: dash(row.feelsLike, degree), color: 'var(--chart-feels)' },
      ]
      series = [
        <Area
          key="t"
          yAxisId="main"
          dataKey="temperature"
          type="monotone"
          stroke={color}
          strokeWidth={3}
          fill="url(#fill-explorer)"
          connectNulls
        />,
        <Line
          key="f"
          yAxisId="main"
          dataKey="feelsLike"
          type="monotone"
          stroke="var(--chart-feels)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls
        />,
      ]
      break
    case 'rain':
      color = 'var(--chart-rain)'
      tickFormat = (n) => `${Math.round(n)}%`
      domain = [0, 100]
      summary = summarizeSeries(rows, 'rainChance', 'Chance of rain', (n) => `${Math.round(n)}%`)
      describe = (row) => [
        { name: 'Chance', value: dash(row.rainChance, (n) => `${Math.round(n)}%`), color },
        {
          name: 'Amount',
          value: dash(row.precipitation, (n) => `${Number(n.toFixed(1))} mm`),
          color: 'var(--color-text)',
        },
      ]
      series = [
        <Bar
          key="c"
          yAxisId="main"
          dataKey="rainChance"
          fill={color}
          fillOpacity={0.55}
          radius={[4, 4, 0, 0]}
          maxBarSize={14}
        />,
        <Line
          key="m"
          yAxisId="mm"
          dataKey="precipitation"
          type="monotone"
          stroke="var(--color-text)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />,
      ]
      break
    case 'wind':
      color = 'var(--chart-wind)'
      domain = [0, 'dataMax + 5']
      tickFormat = (n) => `${Math.round(n)}`
      summary = summarizeWindRows(rows, windUnit)
      describe = (row) => [
        { name: 'Wind', value: dash(row.windSpeed, (n) => `${Math.round(n)} ${windUnit}`), color },
        {
          name: 'Gusts',
          value: dash(row.windGusts, (n) => `${Math.round(n)} ${windUnit}`),
          color: 'var(--color-text)',
        },
      ]
      series = [
        <Area
          key="w"
          yAxisId="main"
          dataKey="windSpeed"
          type="monotone"
          stroke={color}
          strokeWidth={3}
          fill="url(#fill-explorer)"
          connectNulls
        />,
        <Line
          key="g"
          yAxisId="main"
          dataKey="windGusts"
          type="monotone"
          stroke="var(--color-text)"
          strokeWidth={1.5}
          strokeDasharray="4 5"
          dot={false}
          connectNulls
        />,
      ]
      break
    case 'uv':
      color = 'var(--chart-uv)'
      domain = [0, 'dataMax + 1']
      tickFormat = (n) => formatUv(n)
      summary = summarizeSeries(rows, 'uvIndex', 'UV index', (n) => formatUv(n))
      describe = (row) => [
        { name: 'UV index', value: dash(row.uvIndex, (n) => formatUv(n)), color },
      ]
      series = [
        <Area
          key="u"
          yAxisId="main"
          dataKey="uvIndex"
          type="monotone"
          stroke={color}
          strokeWidth={3}
          fill="url(#fill-explorer)"
          connectNulls
        />,
      ]
      break
    case 'humidity':
      color = 'var(--chart-rain)'
      domain = [0, 100]
      tickFormat = (n) => `${Math.round(n)}%`
      summary = summarizeSeries(rows, 'humidity', 'Humidity', (n) => `${Math.round(n)}%`)
      describe = (row) => [
        { name: 'Humidity', value: dash(row.humidity, (n) => `${Math.round(n)}%`), color },
      ]
      series = [
        <Area
          key="h"
          yAxisId="main"
          dataKey="humidity"
          type="monotone"
          stroke={color}
          strokeWidth={3}
          fill="url(#fill-explorer)"
          connectNulls
        />,
      ]
      break
    case 'pressure':
      color = 'var(--chart-feels)'
      domain = ['dataMin - 2', 'dataMax + 2']
      tickFormat = (n) => `${Math.round(n)}`
      summary = summarizeSeries(rows, 'pressure', 'Pressure', (n) => `${Math.round(n)} hPa`)
      describe = (row) => [
        { name: 'Pressure', value: dash(row.pressure, (n) => `${Math.round(n)} hPa`), color },
      ]
      series = [
        <Area
          key="p"
          yAxisId="main"
          dataKey="pressure"
          type="monotone"
          stroke={color}
          strokeWidth={3}
          fill="url(#fill-explorer)"
          connectNulls
        />,
      ]
      break
  }

  const metricLabel = METRICS.find((option) => option.id === metric)?.label ?? ''

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="explorer-title"
    >
      <div className={styles.controls}>
        <h2 id="explorer-title" className={styles.title}>
          Hourly outlook
        </h2>
        <SegmentedControl label="Range" options={RANGES} value={range} onChange={setRange} />
      </div>
      <SegmentedControl label="Measurement" options={METRICS} value={metric} onChange={setMetric} />

      <div className={styles.chart} role="img" aria-label={`${metricLabel} chart. ${summary}`}>
        {/* Remounting per metric replays the draw-in animation each time you switch. */}
        <ResponsiveContainer key={`${metric}-${range}`} width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 12, right: 8, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="fill-explorer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.55 }} />
                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis
              yAxisId="main"
              tickLine={false}
              axisLine={false}
              domain={domain}
              tickFormatter={tickFormat}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis yAxisId="mm" orientation="right" hide domain={[0, 'dataMax + 1']} />
            <Tooltip
              cursor={{ stroke: 'var(--color-text-muted)', strokeDasharray: '4 4' }}
              content={<ExplorerTooltip describe={describe} />}
            />
            {series}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.summary}>{summary}</p>
    </GlassPanel>
  )
}
