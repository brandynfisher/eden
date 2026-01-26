import { fetcher } from '@/lib/fetcher'
import { SessionPlatformFilter } from '@edenlabs/eden-sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdatePlatformFilters = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (platforms: SessionPlatformFilter[]) => {
      return fetcher('/api/user-preferences/platform-filters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platforms }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
  })
}
