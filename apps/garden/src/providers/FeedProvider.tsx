import { useFeed } from '@/hooks/useFeed'
import { UserContext } from '@/providers/UserProvider'
import { Creation, ReactionType } from '@eden-labs/eden-sdk'
import { PropsWithChildren, createContext, useContext } from 'react'

export type Reactions = Record<ReactionType, Record<string, boolean>>
export type Bookmarks = Record<string, boolean>

export interface FeedContextType {
  creations?: Creation[]
  reactions?: Reactions
  setReactions: (reactions: Reactions) => void
  bookmarks?: Record<string, boolean>
  setBookmarks: (bookmarks: Bookmarks) => void
  refetchFeed: () => void
}

export const FeedContext = createContext<FeedContextType>({
  creations: undefined,
  reactions: undefined,
  setReactions: () => {
    return null
  },
  bookmarks: undefined,
  setBookmarks: () => {
    return null
  },
  refetchFeed: () => {
    return null
  },
})

const FeedProvider = ({
  userId,
  children,
}: PropsWithChildren<{ userId?: string }>) => {
  const { isAuthenticated } = useContext(UserContext)
  const feedState = useFeed({ isAuthenticated, userId })

  return (
    <FeedContext.Provider value={feedState}>{children}</FeedContext.Provider>
  )
}

export default FeedProvider
