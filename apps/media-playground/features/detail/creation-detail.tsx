'use client'

import ErrorBoundary from '@/components/error-boundary'
import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import LoadingIndicator from '@/components/loading-indicator'
import CreationMediaPreview from '@/components/media/creation-media-preview'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import DetailSidebar from '@/features/detail/detail-sidebar'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { ChevronDownIcon } from 'lucide-react'
import React, { RefObject, Suspense, useRef } from 'react'

type Props = {
  id: string
  creationSSRData?: CreationV2
  isModal?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

const CreationDetail = ({ id, creationSSRData, isModal, scrollRef }: Props) => {
  const feedSectionRef = useRef<HTMLDivElement>(null)

  const { creation: creationClientData, queryKey } = useCreationQuery({
    key: id,
    initialData: creationSSRData
      ? {
          creation: creationSSRData,
        }
      : undefined,
  })

  const creation = creationClientData || creationSSRData

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

  return (
    <>
      <div
        className={cn([
          `w-full flex flex-col flex-grow lg:flex-row lg:gap-4 max-h-full lg:ml-0`,
          isModal
            ? 'lg:w-[calc(100dvw_-_160px)] lg:min-h-[calc(100dvh_-_98px)]'
            : 'lg:w-[calc(100dvw_-_32px)] lg:min-h-[calc(100dvh_-_198px)]',
        ])}
      >
        {creation ? (
          <CreationMediaPreview creation={creation} isModal={isModal} />
        ) : (
          <Skeleton className="min-h-[512px] w-full rounded-xl opacity-0 animate-fade-in" />
        )}

        <Suspense fallback={<LoadingIndicator />}>
          <ErrorBoundary>
            <DetailSidebar
              item={creation}
              type={'creation'}
              inModal={isModal}
              queryKey={queryKey}
            />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Always render containers to prevent layout shift */}
      <div className="flex justify-center mt-4 min-h-[56px]">
        {creation && (
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer self-center animate-bounce"
            onClick={handleScrollToCreations}
          >
            <ChevronDownIcon className="w-10 h-10" />
          </Button>
        )}
      </div>
      <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-4 pb-6 lg:pt-8 lg:pb-8 px-4 min-h-[80px] lg:min-h-[96px]">
        {creation && (
          <>
            Recent creations from{' '}
            <UserAvatarLink
              name={creation.user.username || creation.user._id}
              image={creation.user.userImage}
              isAgent={creation?.user?.type === 'agent'}
            />
          </>
        )}
      </div>

      <div ref={feedSectionRef} className="px-4 w-full min-h-[400px]">
        {creation && (
          <RecentCreationsFeed
            query={{ user: creation.user._id }}
            scrollRef={scrollRef}
          />
        )}
      </div>
    </>
  )
}

export default CreationDetail
