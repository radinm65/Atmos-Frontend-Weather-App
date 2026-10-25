import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/keys'
import { fetchRadarTimeline } from './rainViewer'

/** RainViewer publishes a new frame about every 10 minutes; checking every 5 is plenty. */
const RADAR_REFRESH_MS = 5 * 60_000

export function useRadarTimeline(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.radar(),
    queryFn: ({ signal }) => fetchRadarTimeline({ signal }),
    enabled,
    staleTime: RADAR_REFRESH_MS,
    refetchInterval: enabled ? RADAR_REFRESH_MS : false,
    refetchIntervalInBackground: false,
  })
}
