import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { Agent, PaginatedCursorResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

export const listQueryKey = ['list', 'agents']

export const useAgentsListQuery = (query?: {
  _id?: string[]
  limit?: number
  owner?: string
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
      const paginationRoute = createCursorPaginationRoute('/api/feed/agents', {
        limit: rest?.limit ?? 4,
        sort: rest?.sort ?? 'createdAt;-1',
        ...rest,
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
