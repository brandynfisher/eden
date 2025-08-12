import { fetcher } from '@/lib/fetcher'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface UpdatePermissionsPayload {
  permissions: Array<{
    username: string
    level: 'editor' | 'owner'
  }>
}

interface UpdatePermissionsResponse {
  success: boolean
  error?: string
}

export const useAgentPermissionsMutation = (agentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdatePermissionsPayload): Promise<UpdatePermissionsResponse> => {
      return fetcher(`/api/agents/${agentId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    onSuccess: () => {
      // Invalidate and refetch agent permissions
      queryClient.invalidateQueries({ 
        queryKey: ['agents', agentId, 'permissions'] 
      })
      
      // Also invalidate shared agents query as permissions might have changed
      queryClient.invalidateQueries({ 
        queryKey: ['agents', 'shared'] 
      })
      
      toast.success('Permissions updated successfully', {
        richColors: true,
        dismissible: true,
      })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error.message || 'Failed to update permissions'
      
      toast.error('Failed to update permissions', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    },
  })
}