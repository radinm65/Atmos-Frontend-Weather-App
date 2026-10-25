import type { AirQualityReport } from '../../../domain/airQuality'
import type { Location } from '../../../domain/location'
import type {
  DailyForecast,
  DataSourceInfo,
  HourlyForecast,
  WeatherCondition,
  WeatherReport,
} from '../../../domain/weather'
import { toLocalDate } from '../../formatting'
import type { AirQualityResponse, ForecastResponse, GeocodingResponse } from './schemas'
import { conditionFromCode } from './wmo'

const toIso = (unixSeconds: number): string => new Date(unixSeconds * 1000).toISOString()

/** Value at `index`, or `null` when the series or the entry is missing. */
function at(series: readonly (number | null)[] | undefined, index: number): number | null {
  return series?.[index] ?? null
}

function isoAt(series: readonly (number | null)[] | undefined, index: number): string | null {
  const value = at(series, index)
  return value === null ? null : toIso(value)
}

function conditionAt(
  series: readonly (number | null)[] | undefined,
  index: number,
): WeatherCondition | null {
  const code = at(series, index)
  return code === null ? null : conditionFromCode(code)
}

function toIsDay(value: number | null | undefined): boolean | null {
  return typeof value === 'number' ? value === 1 : null
}

export function normalizeGeocoding(response: GeocodingResponse): Location[] {
  return (response.results ?? []).map((result) => ({
    id: `om:${result.id}`,
    name: result.name,
    region: result.admin1,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }))
}

export function normalizeAirQuality(
  response: AirQualityResponse,
  source: DataSourceInfo,
  fetchedAt: string,
): AirQualityReport {
  const { current, hourly } = response
  return {
    usAqi: current.us_aqi ?? null,
    europeanAqi: current.european_aqi ?? null,
    pm25: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    ozone: current.ozone ?? null,
    nitrogenDioxide: current.nitrogen_dioxide ?? null,
    sulphurDioxide: current.sulphur_dioxide ?? null,
    carbonMonoxide: current.carbon_monoxide ?? null,
    hourly: hourly.time.map((time, index) => ({
      time: toIso(time),
      usAqi: at(hourly.us_aqi, index),
    })),
    observedAt: toIso(current.time),
    fetchedAt,
    source,
  }
}

export function normalizeForecast(
  response: ForecastResponse,
  location: Location,
  source: DataSourceInfo,
  fetchedAt: string,
): WeatherReport {
  const { current, hourly, daily, timezone } = response

  const hourlyForecast: HourlyForecast[] = hourly.time.map((time, index) => ({
    time: toIso(time),
    temperature: at(hourly.temperature_2m, index),
    feelsLike: at(hourly.apparent_temperature, index),
    humidity: at(hourly.relative_humidity_2m, index),
    precipitationProbability: at(hourly.precipitation_probability, index),
    precipitation: at(hourly.precipitation, index),
    condition: conditionAt(hourly.weather_code, index),
    cloudCover: at(hourly.cloud_cover, index),
    windSpeed: at(hourly.wind_speed_10m, index),
    windGusts: at(hourly.wind_gusts_10m, index),
    pressure: at(hourly.pressure_msl, index),
    uvIndex: at(hourly.uv_index, index),
    isDay: toIsDay(at(hourly.is_day, index)),
  }))

  const dailyForecast: DailyForecast[] = []
  daily.time.forEach((time, index) => {
    const date = toLocalDate(toIso(time), timezone)
    if (date === null) return
    dailyForecast.push({
      date,
      minTemperature: at(daily.temperature_2m_min, index),
      maxTemperature: at(daily.temperature_2m_max, index),
      condition: conditionAt(daily.weather_code, index),
      precipitationProbability: at(daily.precipitation_probability_max, index),
      precipitationSum: at(daily.precipitation_sum, index),
      precipitationHours: at(daily.precipitation_hours, index),
      uvIndexMax: at(daily.uv_index_max, index),
      windSpeedMax: at(daily.wind_speed_10m_max, index),
      windGustsMax: at(daily.wind_gusts_10m_max, index),
      sunrise: isoAt(daily.sunrise, index),
      sunset: isoAt(daily.sunset, index),
      daylightSeconds: at(daily.daylight_duration, index),
      sunshineSeconds: at(daily.sunshine_duration, index),
    })
  })

  return {
    location: { ...location, timezone },
    timezone,
    utcOffsetSeconds: response.utc_offset_seconds,
    current: {
      temperature: current.temperature_2m ?? null,
      feelsLike: current.apparent_temperature ?? null,
      condition: conditionFromCode(current.weather_code),
      humidity: current.relative_humidity_2m ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      windGusts: current.wind_gusts_10m ?? null,
      windDirection: current.wind_direction_10m ?? null,
      precipitation: current.precipitation ?? null,
      pressure: current.pressure_msl ?? null,
      uvIndex: current.uv_index ?? null,
      visibility: current.visibility ?? null,
      dewPoint: current.dew_point_2m ?? null,
      cloudCover: current.cloud_cover ?? null,
      isDay: toIsDay(current.is_day),
      observedAt: toIso(current.time),
    },
    hourly: hourlyForecast,
    daily: dailyForecast,
    fetchedAt,
    source,
  }
}
