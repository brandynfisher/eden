import { useAuth } from '@clerk/nextjs'
import { EdenClient, Trigger } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

interface TriggerWithAgent extends Trigger {
  agent: {
    _id: string
    name: string
    username: string
    userImage?: string
  }
  last_run_time?: Date
}

type Props = {
  enabled?: boolean
}

export const useUserTriggersQuery = ({ enabled = true }: Props = {}) => {
  const { getToken } = useAuth()
  const queryKey: QueryKey = ['user', 'triggers']

  const {
    data,
    error,
    isError,
    isPending,
    isLoading,
    isLoadingError,
    isRefetchError,
    isSuccess,
    status,
  } = useQuery({
    enabled,
    queryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')

      const eden = new EdenClient({
        edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL!,
        token,
      })

      return await eden.agents.triggers.getAllUser({})
    },
  })

  const queryClient = useQueryClient()

  return {
    triggers: (data?.triggers as TriggerWithAgent[]) || [],
    queryKey,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    fetch: () => queryClient.fetchQuery({ queryKey }),
    error,
    isError,
    isPending,
    isLoading,
    isLoadingError,
    isRefetchError,
    isSuccess,
    status,
  }
}
