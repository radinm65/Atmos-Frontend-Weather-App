import type { ConditionCategory, WeatherCondition } from '../../../domain/weather'

/** WMO weather interpretation codes as used by Open-Meteo. */
const WMO: Readonly<Record<number, { category: ConditionCategory; label: string }>> = {
  0: { category: 'clear', label: 'Clear sky' },
  1: { category: 'clear', label: 'Mainly clear' },
  2: { category: 'partly-cloudy', label: 'Partly cloudy' },
  3: { category: 'overcast', label: 'Overcast' },
  45: { category: 'fog', label: 'Fog' },
  48: { category: 'fog', label: 'Freezing fog' },
  51: { category: 'rain', label: 'Light drizzle' },
  53: { category: 'rain', label: 'Drizzle' },
  55: { category: 'rain', label: 'Heavy drizzle' },
  56: { category: 'rain', label: 'Light freezing drizzle' },
  57: { category: 'rain', label: 'Freezing drizzle' },
  61: { category: 'rain', label: 'Light rain' },
  63: { category: 'rain', label: 'Rain' },
  65: { category: 'rain', label: 'Heavy rain' },
  66: { category: 'rain', label: 'Light freezing rain' },
  67: { category: 'rain', label: 'Freezing rain' },
  71: { category: 'snow', label: 'Light snow' },
  73: { category: 'snow', label: 'Snow' },
  75: { category: 'snow', label: 'Heavy snow' },
  77: { category: 'snow', label: 'Snow grains' },
  80: { category: 'rain', label: 'Light rain showers' },
  81: { category: 'rain', label: 'Rain showers' },
  82: { category: 'rain', label: 'Violent rain showers' },
  85: { category: 'snow', label: 'Light snow showers' },
  86: { category: 'snow', label: 'Heavy snow showers' },
  95: { category: 'thunderstorm', label: 'Thunderstorm' },
  96: { category: 'thunderstorm', label: 'Thunderstorm with slight hail' },
  99: { category: 'thunderstorm', label: 'Thunderstorm with heavy hail' },
}

/** Maps a WMO code to a condition. A missing or unrecognised code is "unknown", never guessed. */
export function conditionFromCode(code: number | null | undefined): WeatherCondition {
  if (typeof code !== 'number') {
    return { category: 'unknown', label: 'Conditions unavailable', code: null }
  }
  const known = WMO[code]
  return known
    ? { category: known.category, label: known.label, code }
    : { category: 'unknown', label: 'Unrecognised conditions', code }
}
