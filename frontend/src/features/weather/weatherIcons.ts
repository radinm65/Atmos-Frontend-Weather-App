import type { IconType } from 'react-icons'
import {
  WiCloud,
  WiCloudy,
  WiDayCloudy,
  WiDayFog,
  WiDayShowers,
  WiDaySnow,
  WiDaySunny,
  WiDaySunnyOvercast,
  WiDayThunderstorm,
  WiNa,
  WiNightAltCloudy,
  WiNightAltPartlyCloudy,
  WiNightAltShowers,
  WiNightAltSnow,
  WiNightAltThunderstorm,
  WiNightClear,
  WiNightFog,
  WiRain,
  WiSleet,
  WiSnow,
  WiSprinkle,
  WiThunderstorm,
} from 'react-icons/wi'
import type { ConditionCategory } from '../../domain/weather'

/** Static lookup of every glyph we use, so components pick one without creating components. */
export const WEATHER_ICONS = {
  daySunny: WiDaySunny,
  nightClear: WiNightClear,
  dayMostlyClear: WiDaySunnyOvercast,
  nightMostlyClear: WiNightAltPartlyCloudy,
  dayCloudy: WiDayCloudy,
  nightCloudy: WiNightAltCloudy,
  cloud: WiCloud,
  cloudy: WiCloudy,
  dayFog: WiDayFog,
  nightFog: WiNightFog,
  drizzle: WiSprinkle,
  sleet: WiSleet,
  rain: WiRain,
  snow: WiSnow,
  dayShowers: WiDayShowers,
  nightShowers: WiNightAltShowers,
  daySnow: WiDaySnow,
  nightSnow: WiNightAltSnow,
  dayThunderstorm: WiDayThunderstorm,
  nightThunderstorm: WiNightAltThunderstorm,
  thunderstorm: WiThunderstorm,
  unknown: WiNa,
} as const satisfies Record<string, IconType>

export type WeatherIconKey = keyof typeof WEATHER_ICONS

/**
 * Picks a Weather Icons glyph from the WMO code and day/night. Icons always have a text
 * equivalent next to them (the condition label), so they are decorative for assistive technology.
 */
export function weatherIconKey(
  code: number | null,
  category: ConditionCategory,
  isDay: boolean | null,
): WeatherIconKey {
  const day = isDay !== false

  switch (code) {
    case 0:
      return day ? 'daySunny' : 'nightClear'
    case 1:
      return day ? 'dayMostlyClear' : 'nightMostlyClear'
    case 2:
      return day ? 'dayCloudy' : 'nightCloudy'
    case 3:
      return 'cloudy'
    case 45:
    case 48:
      return day ? 'dayFog' : 'nightFog'
    case 51:
    case 53:
    case 55:
      return 'drizzle'
    case 56:
    case 57:
    case 66:
    case 67:
      return 'sleet'
    case 61:
    case 63:
    case 65:
      return 'rain'
    case 71:
    case 73:
    case 75:
    case 77:
      return 'snow'
    case 80:
    case 81:
    case 82:
      return day ? 'dayShowers' : 'nightShowers'
    case 85:
    case 86:
      return day ? 'daySnow' : 'nightSnow'
    case 95:
      return day ? 'dayThunderstorm' : 'nightThunderstorm'
    case 96:
    case 99:
      return 'thunderstorm'
  }

  // No (or an unrecognised) code: fall back to the broad category.
  switch (category) {
    case 'clear':
      return day ? 'daySunny' : 'nightClear'
    case 'partly-cloudy':
      return day ? 'dayCloudy' : 'nightCloudy'
    case 'overcast':
      return 'cloud'
    case 'fog':
      return day ? 'dayFog' : 'nightFog'
    case 'rain':
      return 'rain'
    case 'snow':
      return 'snow'
    case 'thunderstorm':
      return 'thunderstorm'
    case 'unknown':
      return 'unknown'
  }
}
