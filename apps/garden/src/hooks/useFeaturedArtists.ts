import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useFeaturedArtists = () => {
  const { data, mutate, isLoading, error } = useSWR(
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
