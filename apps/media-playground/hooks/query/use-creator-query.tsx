import { fetcher } from '@/lib/fetcher'
import { Agent, Creator, CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

// Extended Agent type with optional profile fields
type AgentWithProfile = Agent & {
  _id?: string
  username?: string
  userId?: string
  userImage?: string
  createdAt?: string
  updatedAt?: string
  followerCount?: number
  followingCount?: number
  creationsCount?: number
  likedCreationsCount?: number
}

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
  const queryKey = useMemo(() => ['creators', key] as const, [key])

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
        const agentRes = await fetcher<{ agent: AgentWithProfile }>(
          `/api/agents/${key}`,
        )
        if (agentRes?.agent) {
          const agent = agentRes.agent
          return {
            creator: {
              _id: agent._id,
              userId: agent.username || agent.userId || key,
              username: agent.username || agent.userId || key,
              userImage: agent.userImage || '',
              createdAt: agent.createdAt || new Date().toISOString(),
              updatedAt: agent.updatedAt || new Date().toISOString(),
              followerCount: agent.followerCount || 0,
              followingCount: agent.followingCount || 0,
              creationsCount: agent.creationsCount || 0,
              likedCreationsCount: agent.likedCreationsCount || 0,
              type: 'agent',
            },
          } as unknown as CreatorsGetResponse
        }
      } catch (_) {
        // ignore
      }
      return { creator: undefined } as CreatorsGetResponse
    },
  })

  const queryClient = useQueryClient()
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  )

  return {
    invalidate,
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
