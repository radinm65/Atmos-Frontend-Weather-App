import { mix } from '../../lib/color'

/** Colour stops for air temperature in °C, from freezing cold to hot. Bright on dark glass. */
const STOPS: readonly (readonly [number, string])[] = [
  [-15, '#9cc7ff'],
  [0, '#7fd8ff'],
  [10, '#8be6c4'],
  [18, '#e8e86b'],
  [26, '#ffb454'],
  [34, '#ff6f4d'],
  [42, '#ff4d6d'],
]

/** A colour for a temperature, used for range bars. Interpolates between the stops. */
export function temperatureColor(celsius: number): string {
  const first = STOPS[0]!
  const last = STOPS[STOPS.length - 1]!
  if (celsius <= first[0]) return first[1]
  if (celsius >= last[0]) return last[1]
  for (let i = 1; i < STOPS.length; i++) {
    const [upperT, upperC] = STOPS[i]!
    const [lowerT, lowerC] = STOPS[i - 1]!
    if (celsius <= upperT) return mix(lowerC, upperC, (celsius - lowerT) / (upperT - lowerT))
  }
  return last[1]
}
