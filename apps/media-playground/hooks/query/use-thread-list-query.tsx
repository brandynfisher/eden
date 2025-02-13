'use client'

import { fetcher } from '@/lib/fetcher'
import { ThreadsListResponse } from '@edenlabs/eden-sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  agentId?: string
  enabled?: boolean
  page?: number
  limit?: number
}

export const useThreadListQuery = (props?: Props) => {
  const queryKey = ['threads', 'list']

  // console.log('useThreadListQuery', props)
  const { agentId, enabled, limit = 50 } = props || {}
  if (agentId) {
    queryKey.push(agentId)
  }

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
    getNextPageParam: (lastPage: ThreadsListResponse) => {
      return lastPage.nextPage === 0 ? undefined : lastPage.nextPage
    },
    queryFn: async ({ pageParam = 1 }) => {
      // console.log('queryFn', pageParam)
      const response = await fetcher<ThreadsListResponse>(
        `/api/threads/list?page=${pageParam}&limit=${limit}${
          agentId ? `&agentId=${agentId}` : ''
        }`,
      )
      return response
    },
  })

  const threads = data?.pages.flatMap(page => page.docs) ?? []
  const lastPage = data?.pages[data.pages.length - 1]

  // console.log('threads', threads, lastPage, hasNextPage, isFetchingNextPage)

  return {
    threads,
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
  }
}
