import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useFeaturedCreations = () => {
  const { data, mutate, isLoading, error } = useSWRImmutable(
    `/api/feed/creations?page=1&limit=10&orderBy=popularity&direction=-1`,
    fetcher,
  )

  return {
    creations: data?.docs as Creation[] | null,
    mutate,
    isLoading,
    error,
  }
}
