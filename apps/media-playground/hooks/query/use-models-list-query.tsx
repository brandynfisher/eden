import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { ModelV2, PaginatedCursorResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const listQueryKey = ['models']

export const useModelsListQuery = (query?: {
  _id?: string[]
  limit?: number
  user?: string
  sort?: string
  enabled?: boolean
}) => {
  const { enabled, ...rest } = query ?? {}

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
    enabled: enabled,
    queryKey: [...listQueryKey, query],
    queryFn: () => {
      const paginationRoute = createCursorPaginationRoute('/api/feed/models', {
        limit: rest?.limit ?? 4,
        sort: rest?.sort ?? 'createdAt;-1',
        ...rest,
        // cursor: pageParam || '',
      })

      // console.log({paginationRoute})
      return fetcher<PaginatedCursorResponse<ModelV2>>(paginationRoute)
    },
  })

  return {
    models: data?.docs ?? undefined,
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
