'use client'

import { CollectionItem } from '../types/collection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CircularProgress } from '@/components/ui/circular-progress'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/* eslint-disable @next/next/no-img-element */

interface PlayerProps {
  items: CollectionItem[]
  initialMuted?: boolean
}

export function Player({ items, initialMuted = true }: PlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressInterval = useRef<NodeJS.Timeout>()

  const currentItem = items[currentIndex]
  const isVideo = currentItem?.mediaAttributes.mimeType.startsWith('video')

  const goToNextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % items.length)
  }, [items.length])

  const goToPreviousSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length)
  }, [items.length])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err)
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err)
      }
    }
  }

  // Update fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Handle progress tracking
  useEffect(() => {
    // Clear existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    // Reset progress
    setProgress(0)

    if (!currentItem) return

    if (isVideo) {
      // For videos, track actual video progress
      const video = videoRef.current
      if (!video) return

      const duration = currentItem.mediaAttributes.duration || 0
      const updateProgress = () => {
        if (video.currentTime && duration) {
          setProgress((video.currentTime / duration) * 100)
        }
      }

      // Update every 200ms
      progressInterval.current = setInterval(updateProgress, 200)

      const handleVideoEnd = () => {
        goToNextSlide()
      }

      video.addEventListener('ended', handleVideoEnd)
      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
        video.removeEventListener('ended', handleVideoEnd)
      }
    } else {
      const startTime = Date.now()
      const duration = 30000 // 30 seconds

      const updateProgress = () => {
        const elapsed = Date.now() - startTime
        const percentage = Math.min((elapsed / duration) * 100, 100)
        setProgress(percentage)
      }

      // Update every 100ms
      progressInterval.current = setInterval(updateProgress, 100)

      const timer = setTimeout(goToNextSlide, duration)

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
        clearTimeout(timer)
      }
    }
  }, [currentItem, isVideo, goToNextSlide])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousSlide()
      } else if (e.key === 'ArrowRight') {
        goToNextSlide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [goToNextSlide, goToPreviousSlide])

  if (!currentItem) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full bg-black',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={currentItem.url}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted={isMuted}
        />
      ) : (
        <img
          src={currentItem.url}
          alt={currentItem.name}
          className="w-full h-full object-contain"
        />
      )}

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <Button
          onClick={goToPreviousSlide}
          variant="ghost"
          size="icon"
          className="ml-4 [&_svg]:size-6"
        >
          <ChevronLeft />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center">
        <Button
          onClick={goToNextSlide}
          variant="ghost"
          size="icon"
          className="mr-4 [&_svg]:size-6"
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 h-10">
        <Badge variant="outline">
          {currentIndex + 1} / {items.length}
        </Badge>

        {isVideo && (
          <Button
            onClick={() => setIsMuted(!isMuted)}
            variant="ghost"
            size="icon"
            className="[&_svg]:size-5"
          >
            {isMuted ? <VolumeX /> : <Volume2 />}
          </Button>
        )}

        <CircularProgress value={progress} size={20} strokeWidth={2.5} />
      </div>

      <Button
        onClick={toggleFullscreen}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 [&_svg]:size-5"
      >
        {isFullscreen ? <Minimize2 /> : <Maximize2 />}
      </Button>
    </div>
  )
}
