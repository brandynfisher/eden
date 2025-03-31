'use client'

import ErrorBoundary from '@/components/error-boundary'
import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import LoadingIndicator from '@/components/loading-indicator'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import ModelMediaPreview from '@/components/media/model-media-preview'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import DetailSidebar from '@/features/detail/detail-sidebar'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { ChevronDownIcon } from 'lucide-react'
import React, { RefObject, Suspense, useEffect, useRef, useState } from 'react'

type Props = {
  id: string
  modelSSRData?: ModelV2
  isModal?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

const ModelDetail = ({ id, modelSSRData, isModal, scrollRef }: Props) => {
  const { model: modelClientData, queryKey } = useModelQuery({
    key: id,
    initialData: modelSSRData
      ? {
          model: modelSSRData,
        }
      : undefined,
  })

  const model = modelClientData || modelSSRData

  // console.log({ model })

  const [shouldLoadRecentCreations, setShouldLoadRecentCreations] =
    useState(false)
  const [shouldShowRecentCreations, setShouldShowRecentCreations] =
    useState(false)
  const observedRef = useRef<HTMLDivElement>(null)

  // console.log({ shouldRenderRecentCreations, ref: observedRef.current })

  useEffect(() => {
    let observer: IntersectionObserver

    if (observedRef.current) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setShouldLoadRecentCreations(true)
              setShouldShowRecentCreations(true)
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
  }, [observedRef, model?._id])

  const handleScrollToCreations = () => {
    setShouldLoadRecentCreations(true)
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
    <>
      <div
        className={cn([
          `w-full flex flex-col flex-grow lg:flex-row lg:gap-4 max-h-full lg:ml-0`,
          isModal
            ? 'lg:w-[calc(100dvw_-_160px)]'
            : 'lg:w-[calc(100dvw_-_32px)]',
        ])}
      >
        {model ? (
          <ModelMediaPreview model={model} isModal={isModal} />
        ) : (
          <Skeleton className="min-h-[512px] w-full rounded-xl opacity-0 animate-fade-in" />
        )}

        <Suspense fallback={<LoadingIndicator />}>
          <ErrorBoundary>
            <DetailSidebar
              item={model}
              type={'model'}
              inModal={isModal}
              queryKey={queryKey}
            />
          </ErrorBoundary>
        </Suspense>
      </div>
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
          {model ? (
            <>
              <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-4 pb-6 lg:pt-8 lg:pb-8">
                Recent creations using this model
              </div>
              <div
                ref={observedRef}
                className="lg:max-w-[80%] 2xl:max-w-[70%] mx-auto pb-12"
              >
                <div className="relative min-h-[400px]">
                  <div
                    className={cn(
                      'w-full transition-opacity duration-300',
                      shouldLoadRecentCreations && shouldShowRecentCreations
                        ? 'opacity-0 pointer-events-none h-0 overflow-hidden'
                        : 'opacity-100',
                    )}
                  >
                    <MasonrySkeleton />
                  </div>
                  <div
                    className={cn(
                      'w-full transition-opacity duration-300',
                      !shouldShowRecentCreations && 'opacity-0',
                    )}
                  >
                    {shouldLoadRecentCreations && (
                      <Suspense fallback={null}>
                        <ErrorBoundary>
                          <RecentCreationsFeed
                            title="Recent creations using this model"
                            query={{ concept: model._id }}
                            isModal={isModal}
                            scrollRef={scrollRef}
                          />
                        </ErrorBoundary>
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default ModelDetail
