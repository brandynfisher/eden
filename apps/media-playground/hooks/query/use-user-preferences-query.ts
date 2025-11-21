import { fetcher } from '@/lib/fetcher'
import { UserPreferencesGetResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const useUserPreferencesQuery = ({ enabled }: { enabled: boolean }) => {
  const { data, isLoading, error, refetch } =
    useQuery<UserPreferencesGetResponse>({
      queryKey: ['user-preferences'],
      queryFn: () => fetcher('/api/user-preferences'),
      enabled,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

  return {
    lastAgents: data?.last_agents || [],
    pinnedAgents: data?.pinned_agents || [],
    isLoading,
    error,
    refetch,
  }
}
