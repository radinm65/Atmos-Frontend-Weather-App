import type { AppConfig } from '../config/env'
import type { WeatherDataSource } from './dataSource'
import { createLiveSource } from './openMeteo/liveSource'
import { createSnapshotSource } from './snapshot/snapshotSource'

export type { RequestContext, WeatherDataSource } from './dataSource'
export { WeatherApiError, describeError, isAbortError } from './errors'

/** Chooses the data source from configuration. Both implementations stay in the codebase. */
export function createDataSource(config: Pick<AppConfig, 'dataSource'>): WeatherDataSource {
  return config.dataSource === 'snapshot' ? createSnapshotSource() : createLiveSource()
}
