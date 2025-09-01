import { fetcher } from '@/lib/fetcher'
import { Agent, Creator, CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  key: Creator['username']
  initialData?: CreatorsGetResponse
  enabled?: boolean
}

export const useCreatorQuery = ({
  key,
  initialData,
  enabled = true,
}: Props) => {
  const queryKey = ['creators', key]

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
    initialData,
    queryKey,
    queryFn: async () => {
      // Try regular creator endpoint first
      try {
        const res = await fetcher<CreatorsGetResponse>(`/api/users/${key}`)
        if (res?.creator) return res
      } catch (_) {
        // ignore and fallback to agent
      }

      // Fallback to agent endpoint
      try {
        const agentRes = await fetcher<{ agent: Agent }>(`/api/agents/${key}`)
        if (agentRes?.agent) {
          return {
            creator: {
              _id: (agentRes.agent as any)._id,
              userId:
                (agentRes.agent as any).username ||
                (agentRes.agent as any).userId ||
                key,
              username:
                (agentRes.agent as any).username ||
                (agentRes.agent as any).userId ||
                key,
              userImage: (agentRes.agent as any).userImage || '',
              createdAt:
                (agentRes.agent as any).createdAt || new Date().toISOString(),
              followerCount: (agentRes.agent as any).followerCount || 0,
              followingCount: (agentRes.agent as any).followingCount || 0,
              creationCount: (agentRes.agent as any).creationCount || 0,
              type: 'agent',
            },
          } as CreatorsGetResponse
        }
      } catch (_) {
        // ignore
      }
      return { creator: undefined } as CreatorsGetResponse
    },
  })

  const queryClient = useQueryClient()

  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    queryKey,
    creator: data?.creator as Creator | undefined,
    balance: data?.balance || undefined,
    foreverBalance: data?.foreverBalance || undefined,
    subscriptionBalance: data?.subscriptionBalance || undefined,
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
