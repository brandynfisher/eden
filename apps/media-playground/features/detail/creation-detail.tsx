'use client'

import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import CreationMediaPreview from '@/components/media/creation-media-preview'
import ParameterTable from '@/components/timeline/parameter-table'
import { Skeleton } from '@/components/ui/skeleton'
import UserCreationsFeed from '@/components/user-creations-feed'
import UserAvatarLink from '@/components/user/user-avatar-link'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { Suspense, useEffect, useRef, useState } from 'react'

type Props = {
  id: string
  creationSSRData?: CreationV2
  isModal?: boolean
}

const CreationDetail = ({ id, creationSSRData, isModal }: Props) => {
  // const { user } = useAuthState()
  const { creation: creationClientData } = useCreationQuery({
    key: id,
    initialData: creationSSRData
      ? {
          creation: creationSSRData,
        }
      : undefined,
  })

  const creation = creationSSRData || creationClientData

  const [shouldRenderRecentCreations, setShouldRenderRecentCreations] =
    useState(false)
  const observedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let observer: IntersectionObserver

    if (observedRef.current) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setShouldRenderRecentCreations(true)
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
    <>
      <div
        className={cn([
          `w-full flex flex-col flex-grow md:flex-row md:gap-4 max-h-full md:ml-4`,
          isModal
            ? 'h-[calc(100dvh_-_34px)] w-[calc(100dvw_-_32px)]'
            : 'md:h-[calc(100dvh_-_64px)] md:w-[calc(100dvw_-_16px)]',
        ])}
      >
        {creation ? (
          <CreationMediaPreview creation={creation} />
        ) : (
          <Skeleton className="min-h-[512px] w-full rounded-xl" />
        )}

        <div
          className={cn([
            `flex-shrink-0 w-full md:w-[400px] px-4 overflow-y-auto bg-accent rounded-md rounded-tr-none rounded-br-none`,
            isModal ? '' : 'my-4',
          ])}
        >
          {creation?.user ? (
            <div className="py-4">
              <UserAvatarLink
                name={creation.user.username || creation.user._id}
                image={creation.user.userImage}
              />
            </div>
          ) : null}

          {creation && creation.args ? (
            <ParameterTable args={creation.args} />
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="px-4 w-full">
          {creation ? (
            <>
              <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-24 pb-12">
                Recent creations from
                <UserAvatarLink
                  name={creation.user.username || creation.user._id}
                  image={creation.user.userImage}
                />
              </div>
              <div
                ref={observedRef}
                className="md:max-w-[80%] 2xl:max-w-[70%] mx-auto pb-12"
              >
                {shouldRenderRecentCreations ? (
                  <Suspense fallback={<MasonrySkeleton />}>
                    <UserCreationsFeed
                      userName={creation.user.username || ''}
                      maxCols={5}
                    />
                  </Suspense>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default CreationDetail
