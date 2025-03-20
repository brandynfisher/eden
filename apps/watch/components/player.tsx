'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CircularProgress } from '@/components/ui/circular-progress'
import { usePlayer } from '@/contexts/player-context'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/* eslint-disable @next/next/no-img-element */

export function Player() {
  const {
    currentIndex,
    items,
    isMuted,
    setIsMuted,
    mediaDuration,
    applyDurationToVideos,
    goToNextSlide,
    goToPreviousSlide,
  } = usePlayer()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressInterval = useRef<ReturnType<typeof setTimeout>>()

  const currentItem = items[currentIndex]
  const isVideo = currentItem?.mediaAttributes?.mimeType?.startsWith('video')

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

      const videoDuration = currentItem.mediaAttributes?.duration || 0
      const targetDuration = applyDurationToVideos
        ? mediaDuration
        : videoDuration

      // If custom duration is longer than video duration, enable loop
      if (applyDurationToVideos && mediaDuration > videoDuration) {
        video.loop = true
      } else {
        video.loop = false
      }

      const updateProgress = () => {
        if (video.currentTime && targetDuration) {
          // If video is looping, we need to calculate the actual progress including previous loops
          if (video.loop) {
            const elapsedTime = (Date.now() - startTime) / 1000 // Convert to seconds
            setProgress((elapsedTime / targetDuration) * 100)
          } else {
            setProgress((video.currentTime / targetDuration) * 100)
          }
        }
      }

      const startTime = Date.now()

      // Update every 200ms
      progressInterval.current = setInterval(updateProgress, 200)

      const handleVideoEnd = () => {
        // Only go to next slide if we're not looping
        if (!video.loop) {
          goToNextSlide()
        }
      }

      video.addEventListener('ended', handleVideoEnd)

      // If applying custom duration to videos, set up a timer
      if (applyDurationToVideos) {
        const timer = setTimeout(goToNextSlide, mediaDuration * 1000)
        return () => {
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }
          video.removeEventListener('ended', handleVideoEnd)
          clearTimeout(timer)
        }
      }

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
        video.removeEventListener('ended', handleVideoEnd)
      }
    } else {
      const startTime = Date.now()
      const duration = mediaDuration * 1000 // Convert to milliseconds

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
  }, [
    currentItem,
    isVideo,
    goToNextSlide,
    mediaDuration,
    applyDurationToVideos,
  ])

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
          alt={currentItem.filename}
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
