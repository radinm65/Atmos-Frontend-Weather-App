import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { berlinNewHampshire, createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY, loadActiveLocation } from '../locations/activeLocationStorage'
import { SAVED_LOCATIONS_KEY } from '../locations/savedLocationsStorage'

// Leaflet needs real layout and tile loading, which jsdom lacks. The map shell is replaced by a
// stand-in that shows what the page told it and can trigger its callbacks; the Leaflet wiring
// itself is covered by checking it in a real browser.
vi.mock('./WeatherMap', async () => {
  const { useImperativeHandle } = await import('react')
  return {
    WeatherMap: (props: {
      ref?: React.Ref<{ getCenter: () => { latitude: number; longitude: number } }>
      selection: { location: { id: string }; move: string } | null
      markers: readonly { id: string }[]
      radar: { tileUrl: string | null; opacity: number }
      onPickPoint: (latitude: number, longitude: number) => void
      onBaseTileError: () => void
      onRadarLoaded: (status: 'ok' | 'partial') => void
    }) => {
      useImperativeHandle(props.ref, () => ({ getCenter: () => ({ latitude: 10, longitude: 20 }) }))
      return (
        <div
          data-testid="map"
          data-radar={props.radar.tileUrl ?? ''}
          data-opacity={props.radar.opacity}
          data-selected={props.selection?.location.id ?? ''}
          data-move={props.selection?.move ?? ''}
          data-markers={props.markers.map((marker) => marker.id).join(',')}
        >
          <button onClick={() => props.onPickPoint(35.6895, 139.69171)}>Fake map click</button>
          <button onClick={() => props.onRadarLoaded('partial')}>Fake partial radar</button>
          <button onClick={() => props.onBaseTileError()}>Fake base tile error</button>
        </div>
      )
    },
  }
})
vi.mock('../overview/HourlyChart', () => ({ default: () => <div /> }))
vi.mock('../overview/WindChart', () => ({ default: () => <div /> }))

const HOST = 'https://tilecache.rainviewer.com'
const FRAMES = 13

function radarPayload() {
  return {
    version: '2.0',
    generated: 1_792_939_823,
    host: HOST,
    radar: {
      past: Array.from({ length: FRAMES }, (_, i) => ({
        time: 1_792_932_600 + i * 600,
        path: `/v2/radar/hash${i}`,
      })),
      nowcast: [],
    },
  }
}

function stubRadar(
  response: () => Promise<Response> = () => Promise.resolve(Response.json(radarPayload())),
) {
  const fetchMock = vi.fn<typeof fetch>(() => response())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

const tileUrlOf = (index: number) => `${HOST}/v2/radar/hash${index}/512/{z}/{x}/{y}/2/1_1.png`
const map = () => screen.getByTestId('map')

describe('Map page: rain radar', () => {
  it('shows the newest radar frame, its time, and RainViewer attribution', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })

    await waitFor(() => expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 1)))
    expect(screen.getByRole('switch', { name: 'Show rain radar on the map' })).toBeChecked()
    expect(screen.getByText(/your time/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RainViewer' })).toHaveAttribute(
      'href',
      'https://www.rainviewer.com/',
    )
    expect(screen.getByText(/not a forecast/)).toBeInTheDocument()
  })

  it('lets you scrub to an older frame, and pause playback by choosing one', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    await waitFor(() => expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 1)))

    const slider = screen.getByRole('slider', { name: 'Radar time' })
    expect(slider).toHaveAttribute('max', String(FRAMES - 1))
    fireEvent.change(slider, { target: { value: String(FRAMES - 3) } })
    expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 3))
  })

  it('plays through recent frames and can be paused', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    await waitFor(() => expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 1)))

    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    const pause = screen.getByRole('button', { name: 'Pause' })
    expect(pause).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(map().getAttribute('data-radar')).not.toBe(tileUrlOf(FRAMES - 1)), {
      timeout: 4000,
    })

    await userEvent.click(pause)
    const paused = map().getAttribute('data-radar')
    await new Promise((resolve) => setTimeout(resolve, 1400))
    expect(map().getAttribute('data-radar')).toBe(paused)
  })

  it('turns the overlay off and on, and changes its strength', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    await waitFor(() => expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 1)))

    await userEvent.click(screen.getByRole('switch', { name: 'Show rain radar on the map' }))
    expect(map()).toHaveAttribute('data-radar', '')
    expect(screen.queryByRole('slider', { name: 'Radar time' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('switch', { name: 'Show rain radar on the map' }))
    await waitFor(() => expect(map().getAttribute('data-radar')).toContain('/512/{z}/'))

    const strength = screen.getByRole('slider', { name: 'Radar strength' })
    fireEvent.change(strength, { target: { value: '40' } })
    expect(Number(map().getAttribute('data-opacity'))).toBeLessThan(0.75)
  })

  it('keeps the map usable when the radar service fails, and retries', async () => {
    let fail = true
    const fetchMock = stubRadar(() =>
      fail
        ? Promise.reject(new TypeError('offline'))
        : Promise.resolve(Response.json(radarPayload())),
    )
    renderApp('/map', { source: createFakeSource().source })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/rain radar is not available/i)
    expect(map()).toHaveAttribute('data-radar', '')
    expect(screen.getByRole('button', { name: 'Fake map click' })).toBeInTheDocument()

    fail = false
    await userEvent.click(within(alert).getByRole('button', { name: 'Try radar again' }))
    await waitFor(() => expect(map()).toHaveAttribute('data-radar', tileUrlOf(FRAMES - 1)))
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
  })

  it('rejects an unexpected radar response instead of using it', async () => {
    stubRadar(() =>
      Promise.resolve(Response.json({ radar: { past: [] }, host: 'https://evil.example' })),
    )
    renderApp('/map', { source: createFakeSource().source })
    expect(await screen.findByRole('alert')).toHaveTextContent(/not available/i)
    expect(map()).toHaveAttribute('data-radar', '')
  })

  it('warns when radar or base tiles fail to load', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    await waitFor(() => expect(map().getAttribute('data-radar')).not.toBe(''))

    await userEvent.click(screen.getByRole('button', { name: 'Fake partial radar' }))
    expect(screen.getByText(/Some radar tiles did not load/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Fake base tile error' }))
    expect(screen.getByText(/Some map tiles did not load/)).toBeInTheDocument()
  })
})

describe('Map page: choosing a place', () => {
  it('starts on the active place and shows its weather', async () => {
    stubRadar()
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
    renderApp('/map', { source: createFakeSource().source })

    expect(await screen.findByTestId('map')).toHaveAttribute('data-selected', berlin.id)
    expect(map()).toHaveAttribute('data-move', 'fly')
    const details = await screen.findByRole('region', { name: 'Berlin' })
    expect(await within(details).findByText('Open full weather')).toBeInTheDocument()
    expect(await within(details).findByText(/Local time/)).toBeInTheDocument()
  })

  it('asks for a place before one is chosen', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    expect(
      await screen.findByText(/Tap or click the map, or search for a city/),
    ).toBeInTheDocument()
    expect(map()).toHaveAttribute('data-selected', '')
  })

  it('turns a map click into a pin, looks up its weather and does not move the camera', async () => {
    stubRadar()
    const { source, getWeather } = createFakeSource()
    renderApp('/map', { source })

    await userEvent.click(await screen.findByRole('button', { name: 'Fake map click' }))
    expect(map()).toHaveAttribute('data-selected', 'pin:35.69,139.692')
    expect(map()).toHaveAttribute('data-move', 'none')
    expect(
      await screen.findByRole('heading', { name: /Pin at 35\.69° N, 139\.69° E/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Dropped pin/)).toBeInTheDocument()
    await waitFor(() =>
      expect(getWeather).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 35.69, longitude: 139.692 }),
        expect.anything(),
      ),
    )
    expect(
      screen.getByText('Selected Pin at 35.69° N, 139.69° E', { selector: 'p' }),
    ).toBeInTheDocument()
  })

  it('selects a searched city and moves the map to it', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })

    await userEvent.type(await screen.findByRole('combobox'), 'berlin')
    await userEvent.click(await screen.findByRole('option', { name: /New Hampshire/ }))
    expect(map()).toHaveAttribute('data-selected', berlinNewHampshire.id)
    expect(map()).toHaveAttribute('data-move', 'fly')
    expect(await screen.findByRole('region', { name: 'Berlin' })).toBeInTheDocument()
  })

  it('selects the map centre for keyboard users', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })
    await userEvent.click(await screen.findByRole('button', { name: 'Select map centre' }))
    expect(map()).toHaveAttribute('data-selected', 'pin:10,20')
  })

  it('shows saved and active places as markers, but not the selected one twice', async () => {
    stubRadar()
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
    window.localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify([berlin, berlinNewHampshire]))
    renderApp('/map', { source: createFakeSource().source })
    await screen.findByTestId('map')
    expect(map()).toHaveAttribute('data-markers', berlinNewHampshire.id)
  })

  it('shows a clear error for a place with no weather, and retries', async () => {
    stubRadar()
    const { source, getWeather } = createFakeSource()
    getWeather.mockRejectedValueOnce(new WeatherApiError('server', 'down'))
    renderApp('/map', { source })

    await userEvent.click(await screen.findByRole('button', { name: 'Fake map click' }))
    const alert = await screen.findByRole('alert')
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/Local time/)).toBeInTheDocument()
  })

  it('opens the full weather for the selected place', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })

    await userEvent.click(await screen.findByRole('button', { name: 'Fake map click' }))
    await userEvent.click(await screen.findByRole('button', { name: /Open full weather/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(loadActiveLocation()?.id).toBe('pin:35.69,139.692')
  })

  it('saves and compares the selected place', async () => {
    stubRadar()
    renderApp('/map', { source: createFakeSource().source })

    await userEvent.click(await screen.findByRole('button', { name: 'Fake map click' }))
    await userEvent.click(await screen.findByRole('button', { name: /^Save Pin at/ }))
    expect(
      await screen.findByRole('button', { name: /^Saved\. Remove Pin at/ }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Compare Pin at/ }))
    expect(
      screen.getByRole('button', { name: /^Remove Pin at .* from the comparison/ }),
    ).toBeInTheDocument()
  })
})
