import type { DataSourceKind } from '../../domain/weather'

export interface AppConfig {
  dataSource: DataSourceKind
}

/**
 * Reads public build-time configuration. Every VITE_* value is bundled into the client and is
 * public, so nothing secret may be read here (BR-11).
 */
export function readConfig(env: { VITE_DATA_SOURCE?: string } = import.meta.env): AppConfig {
  const raw = env.VITE_DATA_SOURCE?.trim()
  if (raw === undefined || raw === '' || raw === 'live') return { dataSource: 'live' }
  if (raw === 'snapshot') return { dataSource: 'snapshot' }
  throw new Error(`Invalid VITE_DATA_SOURCE "${raw}". Use "live" or "snapshot".`)
}
