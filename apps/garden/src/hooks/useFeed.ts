import { fetcher } from '@/lib/fetcher'
import { Bookmarks, Reactions } from '@/providers/FeedProvider'
import { Creation } from '@eden-labs/eden-sdk'
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
  const [bookmarks, setBookmarks] = useState<Bookmarks | undefined>(undefined)
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
    creations: data?.docs as Creation[],
    reactions,
    setReactions,
    bookmarks,
    setBookmarks,
    refetchFeed,
  }
}
