import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useLoras = (username: string) => {
  const route = username ? `/api/loras?username=${username}` : `/api/loras`

  const { data, isLoading, mutate } = useSWR(route, fetcher)
  return {
    loras: data?.loras,
    isLoading,
    error: data?.error,
    mutate,
  }
}
