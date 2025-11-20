import { useMutation, useQueryClient } from '@tanstack/react-query'

const fetcher = async (url: string, body: { agentId: string }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Failed to update agent preferences')
  }

  return response.json()
}

export const usePinAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      return fetcher('/api/user-preferences/pin-agent', { agentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
  })
}

export const useUnpinAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      return fetcher('/api/user-preferences/unpin-agent', { agentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
  })
}

export const useHideAgent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      return fetcher('/api/user-preferences/hide-agent', { agentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
  })
}
