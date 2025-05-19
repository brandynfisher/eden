import ErrorBoundary from '@/components/error-boundary'
import CreationsFeed from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'

type Props = {
  query: Record<string, string>
  scrollRef?: RefObject<HTMLDivElement>
  initialScrollIndex?: number | null
  onScrollRestored?: () => void
}

export default function RecentCreationsFeed({
  query,
  scrollRef,
  initialScrollIndex,
  onScrollRestored,
}: Props) {
  const [shouldLoadCreations, setShouldLoadCreations] = useState<boolean>(false)
  const observedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver
    const currentObservedRef = observedRef.current

    if (currentObservedRef) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setShouldLoadCreations(true)
              observer.disconnect()
            }
          })
        },
        { threshold: 0.1, rootMargin: '100px' },
      )

      observer.observe(currentObservedRef)
    }

    return () => {
      if (observer && currentObservedRef) {
        if (observer.takeRecords().length > 0 || observer.root) {
          try {
            observer.unobserve(currentObservedRef)
          } catch (e) {
            /* ignore if already unobserved */
          }
        }
        observer.disconnect()
      }
    }
  }, [])

  return (
    <div className="px-4 w-full">
      <div
        ref={observedRef}
        className="lg:max-w-[80%] 2xl:max-w-[70%] mx-auto pb-12"
      >
        <div className="relative min-h-[400px]">
          <div
            className={cn(
              'w-full transition-opacity duration-300 absolute inset-0',
              !shouldLoadCreations && 'opacity-0 pointer-events-none',
            )}
          >
            <Suspense fallback={null}>
              <ErrorBoundary>
                <CreationsFeed
                  query={query}
                  maxCols={5}
                  scrollRef={scrollRef}
                  initialScrollIndex={initialScrollIndex}
                  onScrollRestored={onScrollRestored}
                  showSkeleton
                />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
