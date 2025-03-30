'use client'

import ErrorBoundary from '@/components/error-boundary'
import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import LoadingIndicator from '@/components/loading-indicator'
import CreationMediaPreview from '@/components/media/creation-media-preview'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatarLink from '@/components/user/user-avatar-link'
import DetailSidebar from '@/features/detail/detail-sidebar'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import React, { RefObject, Suspense } from 'react'

type Props = {
  id: string
  creationSSRData?: CreationV2
  isModal?: boolean
  scrollRef?: RefObject<HTMLDivElement>
}

const CreationDetail = ({ id, creationSSRData, isModal, scrollRef }: Props) => {
  const { creation: creationClientData, queryKey } = useCreationQuery({
    key: id,
    initialData: creationSSRData
      ? {
          creation: creationSSRData,
        }
      : undefined,
  })

  const creation = creationClientData || creationSSRData

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
      {creation && (
        <RecentCreationsFeed
          title={
            <>
              Recent creations from{' '}
              <UserAvatarLink
                name={creation.user.username || creation.user._id}
                image={creation.user.userImage}
                isAgent={creation?.user?.type === 'agent'}
              />
            </>
          }
          query={{ user: creation.user._id }}
          isModal={isModal}
          scrollRef={scrollRef}
        />
      )}
    </>
  )
}

export default CreationDetail
