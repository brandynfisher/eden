import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import useSWRImmutable from 'swr/immutable'

export const useFeaturedArtists = () => {
  const { data, mutate, isLoading, error } = useSWRImmutable(
    `/api/feed/creators?page=1&limit=10&orderBy=followerCount&direction=-1`,
    fetcher,
  )

  return {
    creators: data?.docs as Creator[] | null,
    mutate,
    isLoading,
    error,
  }
}
