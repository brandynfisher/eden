import { fetcher } from '@/lib/fetcher'
import { useQuery } from '@tanstack/react-query'

export interface SessionActivityData {
  date: string
  platform: string
  totalUserMessages: number
  sessionCount: number
}

export interface DashboardData {
  sessionActivity: SessionActivityData[]
  dateRange: {
    start: string
    end: string
  }
  platforms: string[]
}

export interface UseAgentDashboardQueryOptions {
  agentId: string
  startDate?: string
  endDate?: string
  enabled?: boolean
}

export const useAgentDashboardQuery = ({
  agentId,
  startDate,
  endDate,
  enabled = true,
}: UseAgentDashboardQueryOptions) => {
  const queryParams = new URLSearchParams()
  if (startDate) queryParams.set('startDate', startDate)
  if (endDate) queryParams.set('endDate', endDate)

  const url = `/api/agents/${agentId}/dashboard${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`

  return useQuery<DashboardData>({
    queryKey: ['agents', agentId, 'dashboard', startDate, endDate],
    queryFn: () => fetcher(url),
    enabled: enabled && !!agentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
