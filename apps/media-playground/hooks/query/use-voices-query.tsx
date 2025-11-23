import { fetcher } from '@/lib/fetcher'
// @ts-ignore - Optional dependency
import type { ElevenLabs } from '@elevenlabs/elevenlabs-js'
import { useQuery } from '@tanstack/react-query'

type Voice = ElevenLabs.Voice

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
