import { fetcher } from '@/lib/fetcher'
import { useQuery } from '@tanstack/react-query'
import { Voice } from 'elevenlabs/api'

export const useVoicesQuery = () => {
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
    queryKey: ['voices'],
    queryFn: () =>
      fetcher<{
        voices: Voice[]
      }>(`/api/voices`),
  })

  return {
    voices: data?.voices ?? [],
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
