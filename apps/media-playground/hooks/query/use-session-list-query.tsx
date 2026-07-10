'use client'

import { fetcher } from '@/lib/fetcher'
import {
  SessionPlatformFilter,
  SessionsV2ListResponse,
} from '@edenlabs/eden-sdk'
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'

type Props = {
  enabled?: boolean
  page?: number
  limit?: number
  agent_id?: string
  platforms?: SessionPlatformFilter[]
  disableInterval?: boolean
}

export const useSessionListQuery = (props?: Props) => {
  const platformsKey = props?.platforms?.slice().sort().join(',') || 'all'
  const queryKey = ['sessions', 'list', props?.agent_id, platformsKey]

  const {
    enabled,
    limit = 25,
    agent_id,
    platforms,
    disableInterval = false,
  } = props || {}

  const queryClient = useQueryClient()

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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    enabled: enabled !== undefined ? enabled : undefined,
    initialPageParam: 1,
    getNextPageParam: (lastPage: SessionsV2ListResponse) => {
      return lastPage.nextPage === 0 ? undefined : lastPage.nextPage
    },
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
      })

      if (agent_id) {
        params.append('agent_id', agent_id)
      }
      if (platforms?.length) {
        platforms.forEach(platform => params.append('platforms', platform))
      }

      const response = await fetcher<SessionsV2ListResponse>(
        `/api/sessions/list?${params.toString()}`,
      )
      return response
    },
    refetchOnWindowFocus: true,
    // 30s (was 5s): this poll is mounted app-wide via the sidebar and refetches
    // every loaded infinite-query page each tick; the websocket session-update
    // events already push real-time changes, so 30s is a fallback, not the path.
    refetchInterval: disableInterval ? false : 30000,
  })

  const sessions = useMemo(
    () => data?.pages.flatMap(page => page.docs) ?? [],
    [data?.pages],
  )
  const lastPage = data?.pages[data.pages.length - 1]

  const renameSession = async (sessionId: string, title: string) => {
    queryClient.setQueryData(
      queryKey,
      (old: InfiniteData<SessionsV2ListResponse>) => {
        // Guard against undefined data
        if (!old || !old.pages) {
          return old
        }

        const newPages = old.pages.map(page => {
          return {
            ...page,
            docs: page.docs?.map(doc =>
              doc._id === sessionId ? { ...doc, title } : doc,
            ),
          }
        })

        return {
          ...old,
          pages: newPages,
        }
      },
    )
  }

  const deleteSession = async (sessionId: string) => {
    queryClient.setQueryData(
      queryKey,
      (old: InfiniteData<SessionsV2ListResponse>) => {
        // Guard against undefined data
        if (!old || !old.pages) {
          return old
        }

        return {
          ...old,
          pages: old.pages.map(page => {
            return {
              ...page,
              docs: page.docs?.filter(doc => doc._id !== sessionId),
            }
          }),
        }
      },
    )
  }

  const updatePinStatus = async (sessionId: string, pinned: boolean) => {
    queryClient.setQueryData(
      queryKey,
      (old: InfiniteData<SessionsV2ListResponse>) => {
        // Guard against undefined data
        if (!old || !old.pages) {
          return old
        }

        const newPages = old.pages.map(page => {
          return {
            ...page,
            docs: page.docs?.map(doc =>
              doc._id === sessionId
                ? { ...doc, pinned, updatedAt: new Date() }
                : doc,
            ),
          }
        })

        return {
          ...old,
          pages: newPages,
        }
      },
    )
  }

  return {
    sessions,
    hasMore: hasNextPage,
    totalPages: lastPage?.totalPages,
    currentPage: lastPage?.page,
    totalDocs: lastPage?.totalDocs,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    fetchNextPage,
    isFetchingNextPage,
    queryKey,
    error,
    isError,
    isPending,
    isLoading,
    isLoadingError,
    isRefetchError,
    isSuccess,
    status,
    renameSession,
    deleteSession,
    updatePinStatus,
  }
}
