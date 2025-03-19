'use client'

import { CollectionItem } from '@/types/collection'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
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
  items: CollectionItem[]
  hasVideos: boolean
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({
  children,
  initialItems,
}: {
  children: ReactNode
  initialItems: CollectionItem[]
}) {
  // Player State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [mediaDuration, setMediaDuration] = useState(15)
  const [applyDurationToVideos, setApplyDurationToVideos] = useState(false)
  const [showSettings, setShowSettings] = useState(true)

  // Check if collection has any videos
  const hasVideos = initialItems.some(item =>
    item.mediaAttributes.mimeType.startsWith('video'),
  )

  const goToNextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % initialItems.length)
  }, [initialItems.length])

  const goToPreviousSlide = useCallback(() => {
    setCurrentIndex(
      prev => (prev - 1 + initialItems.length) % initialItems.length,
    )
  }, [initialItems.length])

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
        items: initialItems,
        hasVideos,
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
