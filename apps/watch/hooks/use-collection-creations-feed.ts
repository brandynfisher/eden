'use client'

import { fetcher } from '@/lib/fetcher'
import {
  CollectionsV2GetCreationsResponse,
  CreationV2,
} from '@edenlabs/eden-sdk'
import {
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

export const useCollectionCreationsFeed = (id: string) => {
  const queryKey: QueryKey = ['feed', 'collections', id, 'creations']

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const url = new URL(`/api/collections/${id}`, window.location.origin)
      if (pageParam) url.searchParams.set('cursor', pageParam)
      return fetcher<CollectionsV2GetCreationsResponse>(url.toString())
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      // If API doesn't support nextCursor yet, return undefined to indicate no more pages
      return 'nextCursor' in lastPage ? lastPage.nextCursor : undefined
    },
  })

  const queryClient = useQueryClient()

  // Flatten all pages into a single array of creations
  const allCreations =
    data?.pages.flatMap(page => page.docs as CreationV2[]) || []

  // Safely handle hasNextPage if the API doesn't support nextCursor yet
  const safeHasNextPage =
    hasNextPage &&
    data?.pages[data.pages.length - 1] &&
    'nextCursor' in data.pages[data.pages.length - 1]

  return {
    creations: allCreations,
    nextCursor: data?.pages[data.pages.length - 1]?.nextCursor,
    hasNextPage: safeHasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    queryKey,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
    refetch: () => queryClient.refetchQueries({ queryKey }),
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
