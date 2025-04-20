'use client'

import ErrorBoundary from '@/components/error-boundary'
import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import LoadingIndicator from '@/components/loading-indicator'
import ModelMediaPreview from '@/components/media/model-media-preview'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DetailSidebar from '@/features/detail/detail-sidebar'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { ChevronDownIcon } from 'lucide-react'
import React, { RefObject, Suspense, useMemo, useRef, useState } from 'react'

type FilterMode = 'all' | 'mine'

type Props = {
  id: string
  modelSSRData?: ModelV2
  isModal?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

const ModelDetail = ({ id, modelSSRData, isModal, scrollRef }: Props) => {
  const { user, isSignedIn } = useAuthState()
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const feedSectionRef = useRef<HTMLDivElement>(null)

  const { model: modelClientData, queryKey } = useModelQuery({
    key: id,
    initialData: modelSSRData
      ? {
          model: modelSSRData,
        }
      : undefined,
  })

  const model = modelClientData || modelSSRData

  const recentCreationsQuery = useMemo(() => {
    if (!model) return {}
    const baseModelQuery = { concept: model._id }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseModelQuery, user: user._id }
    }
    return baseModelQuery
  }, [model, filterMode, user?._id])

  const handleScrollToCreations = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const recentCreationsElement = feedSectionRef.current
        if (isModal && scrollRef?.current && recentCreationsElement) {
          const containerRect = scrollRef.current.getBoundingClientRect()
          const elementRect = recentCreationsElement.getBoundingClientRect()
          scrollRef.current.scrollTo({
            top:
              scrollRef.current.scrollTop +
              elementRect.top -
              containerRect.top -
              80,
            behavior: 'smooth',
          })
        } else {
          recentCreationsElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
          if (recentCreationsElement) {
            window.scrollBy(0, -80)
          }
        }
      }, 100)
    })
  }

  const showFilterTabs = isSignedIn && !!user

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

      {model && (
        <>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer self-center animate-bounce"
              onClick={handleScrollToCreations}
            >
              <ChevronDownIcon className="w-10 h-10" />
            </Button>
          </div>
          <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-4 pb-6 lg:pt-8 lg:pb-8 px-4">
            {`Recent creations using ${model.name}`}
          </div>

          <div ref={feedSectionRef} className="px-4 w-full">
            {showFilterTabs && (
              <Tabs
                value={filterMode}
                onValueChange={value => setFilterMode(value as FilterMode)}
                className="w-full flex justify-center mb-4"
              >
                <TabsList>
                  <TabsTrigger value="all">All Creations</TabsTrigger>
                  <TabsTrigger value="mine">My Creations</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <RecentCreationsFeed
              query={recentCreationsQuery}
              scrollRef={scrollRef}
            />
          </div>
        </>
      )}
    </>
  )
}

export default ModelDetail
