import ErrorBoundary from '@/components/error-boundary'
import CreationsFeed from '@/features/feed/creations-feed'
import { RefObject, Suspense, useEffect, useRef, useState } from 'react'

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
        className="lg:max-w-[95%] 2xl:max-w-[90%] mx-auto pb-12"
      >
        {shouldLoadCreations && (
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
        )}
      </div>
    </div>
  )
}
