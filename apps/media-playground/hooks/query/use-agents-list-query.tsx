import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { Agent, PaginatedCursorResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const listQueryKey = ['agents']

export const useAgentsListQuery = (query?: {
  _id?: string[]
  limit?: number
  owner?: string
  sort?: string
}) => {
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
    queryKey: [...listQueryKey, query?._id],
    queryFn: () => {
      const paginationRoute = createCursorPaginationRoute('/api/feed/agents', {
        limit: query?.limit ?? 4,
        sort: query?.sort ?? 'createdAt;-1',
        ...query,
        // cursor: pageParam || '',
      })

      // console.log({paginationRoute})
      return fetcher<PaginatedCursorResponse<Agent>>(paginationRoute)
    },
  })

  return {
    agents: data?.docs ?? undefined,
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
