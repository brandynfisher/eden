import ErrorBoundary from '@/components/error-boundary'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import { Button } from '@/components/ui/button'
import CreationsFeed from '@/features/feed/creations-feed'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from 'lucide-react'
import React, { RefObject, useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'

type Props = {
  title: React.ReactNode
  query: Record<string, string>
  isModal?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

export default function RecentCreationsFeed({
  title,
  query,
  isModal,
  scrollRef,
}: Props) {
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

  const handleScrollToCreations = () => {
    setShouldLoadCreations(true)
    // Wait for next tick to ensure the content starts loading
    requestAnimationFrame(() => {
      // Then wait a bit more to ensure the content has had a chance to mount
      setTimeout(() => {
        const recentCreationsElement = observedRef.current
        if (isModal && scrollRef?.current && recentCreationsElement) {
          const containerRect = scrollRef.current.getBoundingClientRect()
          const elementRect = recentCreationsElement.getBoundingClientRect()
          scrollRef.current.scrollTo({
            top: elementRect.top - containerRect.top - 20,
            behavior: 'smooth',
          })
        } else {
          recentCreationsElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }, 100)
    })
  }

  return (
    <div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer self-center animate-bounce mt-4"
          onClick={handleScrollToCreations}
        >
          <ChevronDownIcon className="w-10 h-10" />
        </Button>
      </div>
      <div className="px-4 w-full">
        <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-4 pb-6 lg:pt-8 lg:pb-8">
          {title}
        </div>
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
    </div>
  )
}
