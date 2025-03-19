'use client'

import { fetcher } from '@/lib/fetcher'
import { CollectionsV2GetCreationsResponse } from '@edenlabs/eden-sdk'
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCollectionCreations = (id: string) => {
  const queryKey: QueryKey = ['collections', id, 'creations']

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
    queryKey,
    queryFn: () =>
      fetcher<CollectionsV2GetCreationsResponse>(`/api/collections/${id}`),
  })

  const queryClient = useQueryClient()

  return {
    creations:
      (data?.creations as CollectionsV2GetCreationsResponse['creations']) || [],
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
