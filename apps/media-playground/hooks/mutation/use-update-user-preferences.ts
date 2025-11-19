import { fetcher } from '@/lib/fetcher'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      return fetcher('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      })
    },
    onSuccess: () => {
      // Invalidate user preferences query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
  })
}
