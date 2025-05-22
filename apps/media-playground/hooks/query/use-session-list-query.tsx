'use client'

import { fetcher } from '@/lib/fetcher'
import { SessionsV2ListResponse } from '@edenlabs/eden-sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  enabled?: boolean
  page?: number
  limit?: number
}

export const useSessionListQuery = (props?: Props) => {
  const queryKey = ['sessions', 'list']

  const { enabled, limit = 50 } = props || {}

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
      // console.log('queryFn', pageParam)
      const response = await fetcher<SessionsV2ListResponse>(
        `/api/sessions/list?page=${pageParam}&limit=${limit}`,
      )
      return response
    },
  })

  const sessions = data?.pages.flatMap(page => page.docs) ?? []
  const lastPage = data?.pages[data.pages.length - 1]

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
  }
}
