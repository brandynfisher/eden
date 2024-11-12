import { fetcher } from '@/lib/fetcher'
import { Thread, ThreadsListResponse } from '@edenlabs/eden-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const useThreadListQuery = () => {
  const queryKey = ['threads', 'list']

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
    queryFn: () => fetcher<ThreadsListResponse>(`/api/threads/list?limit=50`),
  })

  // console.log({ data })

  const queryClient = useQueryClient()

  return {
    threads: data?.docs as Thread[] | undefined,
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
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
