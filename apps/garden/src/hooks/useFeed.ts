import { fetcher } from '@/lib/fetcher'
import { Reactions } from '@eden-labs/eden-sdk'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

export const useFeed = ({
  isAuthenticated,
  userId,
}: {
  isAuthenticated: boolean
  userId?: string
}) => {
  const [reactions, setReactions] = useState<Reactions | undefined>(undefined)
  const [bookmarks, setBookmarks] = useState<string[] | undefined>(undefined)
  const route = userId ? `/api/feed?userId=${userId}` : '/api/feed'
  const { data, mutate: refetchFeed } = useSWR(route, fetcher)

  useEffect(() => {
    if (data) {
      setReactions(data.reactions)
      setBookmarks(data.bookmarks)
    }
  }, [data])

  useEffect(() => {
    if (isAuthenticated) {
      refetchFeed()
    }
  }, [isAuthenticated])

  return {
    creations: data?.docs,
    reactions,
    setReactions,
    bookmarks,
    setBookmarks,
    refetchFeed,
  }
}
