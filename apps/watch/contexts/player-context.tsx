'use client'

import { CreationV2 } from '@edenlabs/eden-sdk'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface PlayerContextType {
  // Player State
  currentIndex: number
  setCurrentIndex: (index: number) => void
  goToNextSlide: () => void
  goToPreviousSlide: () => void

  // Settings
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  mediaDuration: number
  setMediaDuration: (duration: number) => void
  applyDurationToVideos: boolean
  setApplyDurationToVideos: (apply: boolean) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void

  // Collection Data
  items: CreationV2[]
  hasVideos: boolean

  // Loading
  isLoadingMore: boolean
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({
  children,
  initialItems,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: {
  children: ReactNode
  initialItems: CreationV2[]
  hasNextPage?: boolean
  fetchNextPage?: () => Promise<unknown>
  isFetchingNextPage?: boolean
}) {
  const [items, setItems] = useState<CreationV2[]>(initialItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [mediaDuration, setMediaDuration] = useState(15)
  const [applyDurationToVideos, setApplyDurationToVideos] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Update items when initialItems changes
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Check if collection has any videos
  const hasVideos = items.some(item =>
    item.mediaAttributes?.mimeType?.startsWith('video'),
  )

  // Check if we need to load more items
  useEffect(() => {
    // If we're getting close to the end of the list (within 3 items) and more items are available
    const loadMoreItems = async () => {
      if (
        fetchNextPage &&
        hasNextPage &&
        !isFetchingNextPage &&
        items.length > 0 &&
        items.length - currentIndex <= 3 &&
        !isLoadingMore
      ) {
        try {
          setIsLoadingMore(true)
          await fetchNextPage()
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    loadMoreItems()
  }, [
    currentIndex,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingMore,
    items.length,
  ])

  const goToNextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % items.length)
  }, [items.length])

  const goToPreviousSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length)
  }, [items.length])

  return (
    <PlayerContext.Provider
      value={{
        // Player State
        currentIndex,
        setCurrentIndex,
        goToNextSlide,
        goToPreviousSlide,

        // Settings
        isMuted,
        setIsMuted,
        mediaDuration,
        setMediaDuration,
        applyDurationToVideos,
        setApplyDurationToVideos,
        showSettings,
        setShowSettings,

        // Collection Data
        items,
        hasVideos,

        // Loading
        isLoadingMore,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
