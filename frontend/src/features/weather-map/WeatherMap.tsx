import { useEffect, useImperativeHandle, useRef } from 'react'
import type { Ref } from 'react'
import type { Location } from '../../domain/location'
import { createMapController } from './mapController'
import type { MapController, MapHandlers, RadarState } from './mapController'
import styles from './WeatherMap.module.css'

/** Where a selection came from decides whether the camera follows it. */
export interface MapSelection {
  location: Location
  move: 'fly' | 'none'
}

export interface WeatherMapHandle {
  getCenter: () => { latitude: number; longitude: number } | null
}

export interface WeatherMapProps extends MapHandlers {
  selection: MapSelection | null
  /** Other places worth showing as small markers (saved places). */
  markers: readonly Location[]
  radar: RadarState
  ref?: Ref<WeatherMapHandle>
}

/**
 * The Leaflet map. A thin shell: `mapController` owns every Leaflet object, and the effects below
 * only pass it the latest props.
 */
export function WeatherMap({
  selection,
  markers,
  radar,
  ref,
  onPickPoint,
  onPickLocation,
  onBaseTileError,
  onRadarLoaded,
}: WeatherMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<MapController | null>(null)

  // Leaflet calls these long after render, so it reads the newest callbacks from here.
  const handlersRef = useRef<MapHandlers>({
    onPickPoint,
    onPickLocation,
    onBaseTileError,
    onRadarLoaded,
  })
  useEffect(() => {
    handlersRef.current = { onPickPoint, onPickLocation, onBaseTileError, onRadarLoaded }
  })

  // The first state is sent right after creation so a strict-mode remount restores everything.
  const initialRef = useRef({ selection, markers, radar })
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const controller = createMapController(
      container,
      {
        onPickPoint: (lat, lon) => handlersRef.current.onPickPoint(lat, lon),
        onPickLocation: (location) => handlersRef.current.onPickLocation(location),
        onBaseTileError: () => handlersRef.current.onBaseTileError(),
        onRadarLoaded: (status) => handlersRef.current.onRadarLoaded(status),
      },
      { reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false },
    )
    controllerRef.current = controller
    const initial = initialRef.current
    controller.setMarkers(initial.markers)
    controller.setSelected(initial.selection?.location ?? null, initial.selection?.move ?? 'none')
    controller.setRadar(initial.radar)
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    controllerRef.current?.setMarkers(markers)
  }, [markers])

  useEffect(() => {
    controllerRef.current?.setSelected(selection?.location ?? null, selection?.move ?? 'none')
  }, [selection])

  useEffect(() => {
    controllerRef.current?.setRadar({ tileUrl: radar.tileUrl, opacity: radar.opacity })
  }, [radar.tileUrl, radar.opacity])

  useImperativeHandle(
    ref,
    () => ({ getCenter: () => controllerRef.current?.getCenter() ?? null }),
    [],
  )

  return (
    <div
      ref={containerRef}
      className={styles.map}
      role="region"
      aria-label="Weather map. Tap or click a place to select it. Arrow keys pan and plus and minus zoom."
    />
  )
}
