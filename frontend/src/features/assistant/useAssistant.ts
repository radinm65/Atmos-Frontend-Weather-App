import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/keys'
import { createHttpAssistantService } from './assistantApi'

/** The one service the app uses. Tests replace `fetch`, which this service calls at use time. */
export const assistantService = createHttpAssistantService()

/** Whether this site has a working assistant. Asked once a minute at most, never retried in a loop. */
export function useAssistantStatus() {
  return useQuery({
    queryKey: queryKeys.assistantStatus(),
    queryFn: ({ signal }) => assistantService.getStatus(signal),
    staleTime: 60_000,
    retry: false,
  })
}
