import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location } from '../../domain/location'
import { BASE_TILES, DEFAULT_VIEW, MAP_ATTRIBUTION_PREFIX, MIN_ZOOM, PLACE_ZOOM } from './mapConfig'
import { RADAR_ATTRIBUTION, RADAR_MAX_TILE_ZOOM, RADAR_TILE_SIZE } from './rainViewer'
import styles from './WeatherMap.module.css'

export interface MapHandlers {
  onPickPoint: (latitude: number, longitude: number) => void
  onPickLocation: (location: Location) => void
  /** Called when the base map lost tiles (offline, blocked, or the provider is down). */
  onBaseTileError: () => void
  /** Called each time a radar frame finishes loading; `partial` when some tiles failed. */
  onRadarLoaded: (status: 'ok' | 'partial') => void
}

export interface RadarState {
  /** Leaflet tile URL template of the frame to show, or `null` to hide the overlay. */
  tileUrl: string | null
  opacity: number
}

export interface MapController {
  /** `move` says how the camera follows: not at all (the user tapped the map) or flying there. */
  setSelected: (location: Location | null, move: 'fly' | 'none') => void
  setMarkers: (locations: readonly Location[]) => void
  setRadar: (state: RadarState) => void
  getCenter: () => { latitude: number; longitude: number }
  destroy: () => void
}

/** Radar frames kept on the map at once. Revisited frames then appear instantly. */
const MAX_RADAR_LAYERS = 6

function markerIcon(kind: 'selected' | 'saved'): L.DivIcon {
  const size = kind === 'selected' ? 26 : 18
  return L.divIcon({
    className: kind === 'selected' ? styles.markerSelected : styles.markerSaved,
    html: '<span></span>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/**
 * All imperative Leaflet code lives here, so React only decides what to show. Everything Leaflet
 * creates is removed again in `destroy`.
 */
export function createMapController(
  container: HTMLElement,
  handlers: MapHandlers,
  options: { reducedMotion: boolean },
): MapController {
  const map = L.map(container, {
    center: DEFAULT_VIEW.center,
    zoom: DEFAULT_VIEW.zoom,
    minZoom: MIN_ZOOM,
    worldCopyJump: true,
    attributionControl: false,
  })
  L.control.attribution({ prefix: MAP_ATTRIBUTION_PREFIX }).addTo(map)

  const base = L.tileLayer(BASE_TILES.url, {
    attribution: BASE_TILES.attribution,
    maxZoom: BASE_TILES.maxZoom,
    className: styles.baseTiles,
  }).addTo(map)
  base.on('tileerror', () => handlers.onBaseTileError())

  map.on('click', (event: L.LeafletMouseEvent) => {
    const { lat, lng } = event.latlng
    handlers.onPickPoint(lat, lng)
  })

  // The container can change size without a window resize (layout shifts, orientation changes).
  const resizeObserver = new ResizeObserver(() => map.invalidateSize())
  resizeObserver.observe(container)

  let selectedMarker: L.Marker | null = null
  const savedLayer = L.layerGroup().addTo(map)

  function makeMarker(location: Location, kind: 'selected' | 'saved'): L.Marker {
    const marker = L.marker([location.latitude, location.longitude], {
      icon: markerIcon(kind),
      title: location.name,
      alt: location.name,
      keyboard: true,
      riseOnHover: true,
    })
    marker.on('click', () => handlers.onPickLocation(location))
    return marker
  }

  // ---- Radar overlay -------------------------------------------------------------------------
  const radarLayers = new Map<string, L.TileLayer>()
  const loadedFrames = new Set<string>()
  const failedTiles = new Map<string, number>()
  let wantedUrl: string | null = null
  let shownUrl: string | null = null
  let radarOpacity = 0.7

  function syncRadarOpacity() {
    for (const [url, layer] of radarLayers) layer.setOpacity(url === shownUrl ? radarOpacity : 0)
  }

  function showWhenReady(url: string) {
    if (url !== wantedUrl || !loadedFrames.has(url)) return
    shownUrl = url
    syncRadarOpacity()
    handlers.onRadarLoaded((failedTiles.get(url) ?? 0) > 0 ? 'partial' : 'ok')
  }

  function addRadarLayer(url: string): L.TileLayer {
    const layer = L.tileLayer(url, {
      tileSize: RADAR_TILE_SIZE,
      // 512px tiles are addressed one zoom level lower; the free tier stops at tile zoom 7.
      zoomOffset: -1,
      maxNativeZoom: RADAR_MAX_TILE_ZOOM + 1,
      maxZoom: BASE_TILES.maxZoom,
      opacity: 0,
      attribution: RADAR_ATTRIBUTION,
      className: styles.radarTiles,
      zIndex: 10,
      // The radar is a transparent overlay, so it must not be fetched while the user pans a lot.
      updateWhenIdle: true,
      keepBuffer: 0,
    })
    layer.on('tileerror', () => failedTiles.set(url, (failedTiles.get(url) ?? 0) + 1))
    layer.on('load', () => {
      loadedFrames.add(url)
      showWhenReady(url)
    })
    layer.addTo(map)
    radarLayers.set(url, layer)
    return layer
  }

  function evictRadarLayers() {
    for (const url of radarLayers.keys()) {
      if (radarLayers.size <= MAX_RADAR_LAYERS) break
      if (url === wantedUrl || url === shownUrl) continue
      radarLayers.get(url)?.remove()
      radarLayers.delete(url)
      loadedFrames.delete(url)
      failedTiles.delete(url)
    }
  }

  return {
    setSelected(location, move) {
      selectedMarker?.remove()
      selectedMarker = null
      if (!location) return
      selectedMarker = makeMarker(location, 'selected').addTo(map)
      if (move === 'fly') {
        const target: L.LatLngTuple = [location.latitude, location.longitude]
        const zoom = Math.max(map.getZoom(), PLACE_ZOOM)
        if (options.reducedMotion) map.setView(target, zoom, { animate: false })
        else map.flyTo(target, zoom, { duration: 1.4 })
      }
    },

    setMarkers(locations) {
      savedLayer.clearLayers()
      for (const location of locations) makeMarker(location, 'saved').addTo(savedLayer)
    },

    setRadar({ tileUrl, opacity }) {
      radarOpacity = opacity
      wantedUrl = tileUrl
      if (tileUrl === null) {
        for (const layer of radarLayers.values()) layer.remove()
        radarLayers.clear()
        loadedFrames.clear()
        failedTiles.clear()
        shownUrl = null
        return
      }
      if (!radarLayers.has(tileUrl)) addRadarLayer(tileUrl)
      // A frame seen before is already loaded; a new one stays hidden until its tiles arrive,
      // so the previous frame stays on screen instead of flickering away.
      showWhenReady(tileUrl)
      syncRadarOpacity()
      evictRadarLayers()
    },

    getCenter() {
      const { lat, lng } = map.getCenter().wrap()
      return { latitude: lat, longitude: lng }
    },

    destroy() {
      resizeObserver.disconnect()
      map.remove()
    },
  }
}
