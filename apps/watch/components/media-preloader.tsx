'use client'

import { usePlayer } from '@/contexts/player-context'
import { useMediaPrefetch } from '@/hooks/use-media-prefetch'
import { getProxiedUrl } from '@/lib/utils'
import { useEffect } from 'react'

/**
 * Preloads media assets (images and videos) to ensure they're available in browser cache
 * before being displayed to the user
 */
export function MediaPreloader() {
  const { items, currentIndex } = usePlayer()
  const { prefetch, cleanup } = useMediaPrefetch()

  // Number of items to preload ahead of current index
  const PRELOAD_COUNT = 3

  useEffect(() => {
    const urlsToKeep: string[] = []

    // Preload the next few items
    if (items && items.length > 0) {
      for (let i = 0; i < PRELOAD_COUNT; i++) {
        const index = (currentIndex + i) % items.length
        const item = items[index]

        if (!item || !item.url) continue

        const url = item.url
        const mimeType = item.mediaAttributes?.mimeType || ''

        // Get proxied URL for videos
        const proxiedUrl = getProxiedUrl(url, mimeType)

        // Determine if this is the next item (for more aggressive preloading)
        const isNextItem = i === 1 // First item (i=0) is current, second (i=1) is next

        // Add both original and proxied URLs to our keep list
        urlsToKeep.push(url)

        // If it's a proxied URL, we need to keep that too
        if (proxiedUrl !== url) {
          urlsToKeep.push(proxiedUrl)
        }

        // Prefetch with more aggressive settings for the next item
        prefetch(url, mimeType, {
          prefetchVideoData: isNextItem,
        })

        // If it's a video, also prefetch the proxied URL
        if (mimeType.startsWith('video')) {
          prefetch(proxiedUrl, mimeType, {
            prefetchVideoData: isNextItem,
          })
        }
      }
    }

    // Cleanup any resources we don't need anymore
    cleanup(urlsToKeep)
  }, [currentIndex, items, prefetch, cleanup])

  // This component doesn't render anything visible
  return null
}
