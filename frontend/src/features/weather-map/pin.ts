import type { Location } from '../../domain/location'

const clampLatitude = (value: number) => Math.min(90, Math.max(-90, value))
/** Fold any longitude (Leaflet lets you pan around the world more than once) into -180..180. */
const wrapLongitude = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180

/** "52.52° N, 13.41° E": readable and screen-reader friendly. */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(longitude).toFixed(2)}° ${longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lon}`
}

/**
 * A place chosen by tapping the map. Open-Meteo has no reverse geocoding, so it is named by its
 * coordinates rather than by a guess. Rounded to about 100 m so the same spot gets the same id.
 */
export function createPinLocation(latitude: number, longitude: number): Location {
  const lat = Number(clampLatitude(latitude).toFixed(3))
  const lon = Number(wrapLongitude(longitude).toFixed(3))
  return {
    id: `pin:${lat},${lon}`,
    name: `Pin at ${formatCoordinates(lat, lon)}`,
    latitude: lat,
    longitude: lon,
  }
}

export function isPin(location: Location): boolean {
  return location.id.startsWith('pin:')
}
