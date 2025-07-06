import { useAuth } from '@clerk/nextjs'
import { Deployment, EdenClient } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

interface DeploymentWithAgent extends Deployment {
  agent: {
    _id: string
    name: string
    username: string
    userImage?: string
  }
}

type Props = {
  enabled?: boolean
}

export const useUserDeploymentsQuery = ({ enabled = true }: Props = {}) => {
  const { getToken } = useAuth()
  const queryKey: QueryKey = ['user', 'deployments']

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

      return await eden.agents.deployments.getAllUser({})
    },
  })

  const queryClient = useQueryClient()

  return {
    deployments: (data?.deployments as DeploymentWithAgent[]) || [],
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
