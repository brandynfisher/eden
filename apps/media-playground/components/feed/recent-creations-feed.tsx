import ErrorBoundary from '@/components/error-boundary'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import CreationsFeed from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'

type Props = {
  query: Record<string, string>
  scrollRef?: RefObject<HTMLDivElement>
}

export default function RecentCreationsFeed({ query, scrollRef }: Props) {
  const [shouldLoadCreations, setShouldLoadCreations] = useState(false)
  const [shouldShowCreations, setShouldShowCreations] = useState(false)
  const observedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver

    if (observedRef.current) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setShouldLoadCreations(true)
              setShouldShowCreations(true)
            }
          })
        },
        { threshold: 0.1 },
      )

      observer.observe(observedRef.current)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [observedRef])

  return (
    <div className="px-4 w-full">
      <div
        ref={observedRef}
        className="lg:max-w-[80%] 2xl:max-w-[70%] mx-auto pb-12"
      >
        <div className="relative min-h-[400px]">
          <div
            className={cn(
              'w-full transition-opacity duration-300',
              shouldLoadCreations && shouldShowCreations
                ? 'opacity-0 pointer-events-none h-0 overflow-hidden'
                : 'opacity-100',
            )}
          >
            <MasonrySkeleton />
          </div>
          <div
            className={cn(
              'w-full transition-opacity duration-300',
              !shouldShowCreations && 'opacity-0',
            )}
          >
            {shouldLoadCreations && (
              <Suspense fallback={null}>
                <ErrorBoundary>
                  <CreationsFeed
                    query={query}
                    maxCols={5}
                    scrollRef={scrollRef}
                  />
                </ErrorBoundary>
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
