'use client'

import { useCallback, useRef } from 'react'

// Check if we're in a development environment
const isDevelopment =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'

interface PrefetchOptions {
  /**
   * If true, prefetch video data more aggressively (not just metadata)
   */
  prefetchVideoData?: boolean

  /**
   * Cross-origin attribute for media elements
   */
  crossOrigin?: 'anonymous' | 'use-credentials'
}

/**
 * Hook to prefetch media items (images and videos)
 * This can be used outside of the player context to preload media
 */
export function useMediaPrefetch() {
  const prefetchedImages = useRef<Set<string>>(new Set())
  const prefetchedVideos = useRef<Set<string>>(new Set())
  const videoElements = useRef<Record<string, HTMLVideoElement>>({})

  /**
   * Prefetch a media item based on its URL and mime type
   */
  const prefetch = useCallback(
    (url: string, mimeType?: string, options?: PrefetchOptions) => {
      if (!url) return

      const isVideo = mimeType?.startsWith('video')

      if (isVideo) {
        // Skip if already prefetched
        if (prefetchedVideos.current.has(url)) return

        // For videos, we'll use a simplified approach to avoid CORS issues
        // Create a basic fetch request to initiate browser caching
        fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => {
          // Ignore errors - this is just prefetching
        })

        // Mark as prefetched
        prefetchedVideos.current.add(url)

        // We'll still create a minimal video element for videos that need more aggressive preloading
        if (options?.prefetchVideoData) {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.muted = true
          video.playsInline = true

          // Apply crossOrigin attribute if specified and not in development
          if (options?.crossOrigin && !isDevelopment) {
            video.crossOrigin = options.crossOrigin
          }

          video.src = url

          // Just load the metadata
          video.load()

          // Store for cleanup
          videoElements.current[url] = video
        }
      } else {
        // Skip if already prefetched
        if (prefetchedImages.current.has(url)) return

        // Create an image element for prefetching
        const img = new Image()

        // Apply crossOrigin attribute if specified and not in development
        if (options?.crossOrigin && !isDevelopment) {
          img.crossOrigin = options.crossOrigin
        }

        img.src = url
        prefetchedImages.current.add(url)
      }
    },
    [],
  )

  /**
   * Cleanup prefetched resources that are no longer needed
   */
  const cleanup = useCallback((urlsToKeep: string[] = []) => {
    const keepSet = new Set(urlsToKeep)

    // Clean up video elements that aren't in the keep set
    Object.keys(videoElements.current).forEach(url => {
      if (!keepSet.has(url)) {
        const video = videoElements.current[url]
        if (video) {
          // Cancel any pending requests and release memory
          video.pause()
          video.removeAttribute('src')
          video.load()
          delete videoElements.current[url]
        }
      }
    })

    // Remove video URLs from tracking that are no longer needed
    prefetchedVideos.current.forEach(url => {
      if (!keepSet.has(url)) {
        prefetchedVideos.current.delete(url)
      }
    })

    // Remove image URLs from tracking that are no longer needed
    prefetchedImages.current.forEach(url => {
      if (!keepSet.has(url)) {
        prefetchedImages.current.delete(url)
      }
    })
  }, [])

  return {
    prefetch,
    cleanup,
    prefetchedImages: prefetchedImages.current,
    prefetchedVideos: prefetchedVideos.current,
  }
}
