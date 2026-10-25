import { Crosshair } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { Location } from '../../domain/location'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { LocationSearch } from '../locations/LocationSearch'
import { useActiveLocation } from '../locations/useActiveLocation'
import { useSavedLocations } from '../locations/useSavedLocations'
import styles from './MapPage.module.css'
import { PlaceDetails } from './PlaceDetails'
import { RadarControls } from './RadarControls'
import { createPinLocation } from './pin'
import { nextPlaybackFrame, pickFrame, radarTileUrl } from './rainViewer'
import { useRadarTimeline } from './useRadarTimeline'
import { WeatherMap } from './WeatherMap'
import type { MapSelection, WeatherMapHandle } from './WeatherMap'

/** One step of playback. Slow enough to stay inside the radar service's request limit. */
const PLAYBACK_STEP_MS = 1100
const DEFAULT_RADAR_OPACITY = 0.75

export function MapPage() {
  useDocumentTitle('Map')
  const navigate = useNavigate()
  const { activeLocation, setActiveLocation } = useActiveLocation()
  const { saved } = useSavedLocations()
  const mapRef = useRef<WeatherMapHandle>(null)

  const [selection, setSelection] = useState<MapSelection | null>(
    activeLocation ? { location: activeLocation, move: 'fly' } : null,
  )
  const [announcement, setAnnouncement] = useState('')

  const [radarOn, setRadarOn] = useState(true)
  const [opacity, setOpacity] = useState(DEFAULT_RADAR_OPACITY)
  const [chosenTime, setChosenTime] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)
  const [baseTilesFailed, setBaseTilesFailed] = useState(false)

  const timeline = useRadarTimeline(radarOn)
  const frames = useMemo(() => timeline.data?.frames ?? [], [timeline.data])
  const frame = pickFrame(frames, chosenTime)
  const radarState = !radarOn
    ? 'ready'
    : timeline.data
      ? 'ready'
      : timeline.isError
        ? 'error'
        : 'loading'

  // Playback steps through the newest frames and stops when the radar is hidden or unavailable.
  const playbackActive = playing && radarOn && frames.length > 1
  useEffect(() => {
    if (!playbackActive) return
    const timer = window.setInterval(() => {
      setChosenTime(
        (current) =>
          nextPlaybackFrame(frames, current ?? frames.at(-1)?.time ?? null)?.time ?? null,
      )
    }, PLAYBACK_STEP_MS)
    return () => window.clearInterval(timer)
  }, [playbackActive, frames])

  // The saved places, and the active one, show as small markers; the selected place is separate.
  const markers = useMemo(() => {
    const all = activeLocation ? [activeLocation, ...saved] : [...saved]
    return all.filter(
      (place, index) =>
        all.findIndex((other) => other.id === place.id) === index &&
        place.id !== selection?.location.id,
    )
  }, [activeLocation, saved, selection])

  const radar = useMemo(
    () => ({
      tileUrl: radarOn && timeline.data && frame ? radarTileUrl(timeline.data, frame) : null,
      opacity,
    }),
    [radarOn, timeline.data, frame, opacity],
  )

  function select(location: Location, move: 'fly' | 'none') {
    setSelection({ location, move })
    setAnnouncement(`Selected ${location.name}`)
  }

  function openWeather(location: Location) {
    setActiveLocation(location)
    navigate('/')
  }

  function selectMapCentre() {
    const centre = mapRef.current?.getCenter()
    if (centre) select(createPinLocation(centre.latitude, centre.longitude), 'none')
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Map</h1>

      <GlassPanel
        as="section"
        strong
        interactive={false}
        className={styles.search}
        aria-label="Find a place on the map"
      >
        <div className={styles.searchBox}>
          <LocationSearch onSelect={(location) => select(location, 'fly')} />
        </div>
        <Button variant="secondary" className={styles.centreButton} onClick={selectMapCentre}>
          <Crosshair size={18} aria-hidden="true" />
          Select map centre
        </Button>
      </GlassPanel>

      <div className={styles.layout}>
        <GlassPanel interactive={false} className={styles.mapFrame}>
          <WeatherMap
            ref={mapRef}
            selection={selection}
            markers={markers}
            radar={radar}
            onPickPoint={(latitude, longitude) =>
              select(createPinLocation(latitude, longitude), 'none')
            }
            onPickLocation={(location) => select(location, 'fly')}
            onBaseTileError={() => setBaseTilesFailed(true)}
            onRadarLoaded={(status) => setTilesFailed(status === 'partial')}
          />
          {baseTilesFailed ? (
            <p role="status" className={styles.mapNotice}>
              Some map tiles did not load. Check your connection; the map may look incomplete.
            </p>
          ) : null}
        </GlassPanel>

        <div className={styles.side}>
          <RadarControls
            enabled={radarOn}
            onEnabledChange={(enabled) => {
              setRadarOn(enabled)
              setPlaying(false)
              setTilesFailed(false)
            }}
            state={radarState}
            onRetry={() => void timeline.refetch()}
            frames={frames}
            frame={frame}
            onFrameChange={(time) => {
              setPlaying(false)
              setChosenTime(time)
            }}
            playing={playbackActive}
            onPlayingChange={setPlaying}
            opacity={opacity}
            onOpacityChange={setOpacity}
            tilesFailed={tilesFailed}
          />
          <PlaceDetails location={selection?.location ?? null} onOpenWeather={openWeather} />
        </div>
      </div>

      <p role="status" aria-live="polite" className="visually-hidden">
        {announcement}
      </p>
    </div>
  )
}
