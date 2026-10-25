/**
 * Map provider configuration, kept apart from the map UI (TRD §6) so a provider can be swapped by
 * editing this file only. Policies were checked in Phase 0/5; see docs/PROVIDER_VALIDATION.md.
 */

/**
 * OpenStreetMap standard tiles (D-07). Allowed on public sites with visible attribution and a
 * valid Referer: never set a Referrer-Policy that strips it. No prefetching, no SLA.
 */
export const BASE_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
} as const

export const MAP_ATTRIBUTION_PREFIX =
  '<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>'

/** World view shown before any place is chosen. */
export const DEFAULT_VIEW = { center: [28, 12] as [number, number], zoom: 2 }
export const MIN_ZOOM = 2

/** Zoom used when the map moves to a chosen place: city scale, still inside the radar's range. */
export const PLACE_ZOOM = 7
