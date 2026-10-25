/** Look of each compared city: a colour plus a line pattern, so colour is never the only cue. */
export interface SeriesStyle {
  color: string
  /** SVG `stroke-dasharray`; empty means solid. */
  dash: string
  /** How the pattern is described in words for the legend. */
  pattern: string
}

const STYLES: readonly SeriesStyle[] = [
  { color: 'var(--series-1)', dash: '', pattern: 'solid line' },
  { color: 'var(--series-2)', dash: '8 5', pattern: 'dashed line' },
  { color: 'var(--series-3)', dash: '2 5', pattern: 'dotted line' },
  { color: 'var(--series-4)', dash: '10 4 2 4', pattern: 'dash-dot line' },
]

export function seriesStyle(index: number): SeriesStyle {
  return STYLES[index % STYLES.length] as SeriesStyle
}
