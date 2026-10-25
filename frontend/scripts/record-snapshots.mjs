// Records real Open-Meteo forecasts for a small curated list of cities, as static files the app can
// serve in "snapshot" mode (OPEN_DECISIONS D-18, docs/TRD.md §4a).
//
//   npm run snapshots:record
//   npm run snapshots:record -- --out public/snapshots --cities scripts/snapshot-cities.json
//
// It uses the app's own URL builder, validation and file format (loaded through Vite), so a snapshot
// is always something the app can read. Nothing is written unless every city succeeds, and the
// requests are sequential and spaced out to stay far below Open-Meteo's limits (non-commercial use).
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const outDir = path.resolve(root, option('out', 'public/snapshots'))
const citiesFile = path.resolve(root, option('cities', 'scripts/snapshot-cities.json'))
const DELAY_MS = 500

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return response.json()
}

const server = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  // No file watcher: the script writes into public/ and must not trigger Vite's HMR machinery.
  server: { middlewareMode: true, watch: null },
})

try {
  const client = await server.ssrLoadModule('/src/lib/api/openMeteo/client.ts')
  const schemas = await server.ssrLoadModule('/src/lib/api/openMeteo/schemas.ts')
  const normalize = await server.ssrLoadModule('/src/lib/api/openMeteo/normalize.ts')
  const format = await server.ssrLoadModule('/src/lib/api/snapshot/format.ts')

  const cities = JSON.parse(await readFile(citiesFile, 'utf8'))
  console.log(`Recording ${cities.length} cities from ${path.relative(root, citiesFile)}...`)

  const recorded = []
  for (const city of cities) {
    // Resolve the place through the same geocoding endpoint the app uses, limited to its country.
    const geocodingUrl = new URL(client.buildGeocodingUrl(city.query, 10))
    geocodingUrl.searchParams.set('countryCode', city.countryCode)
    const raw = await getJson(geocodingUrl)
    // Prefer an exact-name populated place (a city) over regions or islands, then the most
    // populous one, which is the city people mean.
    const results = raw.results ?? []
    const populated = results.filter((r) => String(r.feature_code ?? '').startsWith('PPL'))
    const exact = populated.filter((r) => r.name.toLowerCase() === city.query.toLowerCase())
    const pool = exact.length ? exact : populated.length ? populated : results
    pool.sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    const [location] = pool[0]
      ? normalize.normalizeGeocoding(schemas.geocodingResponseSchema.parse({ results: [pool[0]] }))
      : []
    if (!location) throw new Error(`No geocoding result for ${city.query} (${city.countryCode})`)

    await sleep(DELAY_MS)
    const forecast = await getJson(client.buildForecastUrl(location.latitude, location.longitude))
    // Fail now if the provider's response is not one the app can read.
    client.parseForecastResponse(forecast)

    recorded.push({ location, forecast })
    console.log(`  ok  ${location.name}, ${location.country ?? ''} (${location.id})`)
    await sleep(DELAY_MS)
  }

  const capturedAt = new Date().toISOString()
  const manifest = format.buildManifest(
    recorded.map((entry) => entry.location),
    capturedAt,
  )
  format.manifestSchema.parse(manifest)

  // Everything succeeded: replace the previous recording.
  await mkdir(outDir, { recursive: true })
  for (const name of await readdir(outDir)) {
    if (name.endsWith('.json')) await rm(path.join(outDir, name))
  }
  let bytes = 0
  for (const entry of recorded) {
    const file = format.buildSnapshotFile(entry.location, entry.forecast, capturedAt)
    format.snapshotFileSchema.parse(file)
    const text = JSON.stringify(file)
    bytes += text.length
    await writeFile(path.join(outDir, format.snapshotFileName(entry.location.id)), text)
  }
  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

  console.log(
    `Wrote ${recorded.length} snapshots (${(bytes / 1024).toFixed(0)} KB) to ${path.relative(root, outDir)} at ${capturedAt}.`,
  )
} catch (error) {
  console.error(
    `Recording failed; existing snapshots were left untouched.\n${error.message ?? error}`,
  )
  process.exitCode = 1
} finally {
  await server.close()
}
