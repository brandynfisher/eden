import { fetcher } from '@/lib/fetcher'
import { useQuery } from '@tanstack/react-query'

export interface SessionActivityData {
  date: string
  platform: string
  totalUserMessages: number
  sessionCount: number
}

export interface MessageActivityData {
  date: string
  platform: string
  messageCount: number
  tokenCount?: number
}

export interface UserStatsData {
  username: string
  messageCount: number
  tokenCount?: number
}

export interface MessageDataItem {
  _id: string
  platform: string
  role: string
  username: string
  timestamp: string
  date: string
  sender: string
}

export interface DashboardData {
  // Backward compatibility
  sessionActivity: SessionActivityData[]
  // New enhanced data
  messageActivity: MessageActivityData[]
  userStats: UserStatsData[]
  dateRange: {
    start: string
    end: string
  }
  platforms: string[]
  roles: string[]
  activityMetadata?: {
    oldestMessageDate?: string
    newestMessageDate?: string
    totalMessages: number
    hasRecentActivityOnly: boolean
  }
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
    queryFn: async (): Promise<DashboardData> => {
      const result = (await fetcher(url)) as DashboardData

      return result
    },
    enabled: enabled && !!agentId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
