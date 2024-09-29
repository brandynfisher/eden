'use client'

import LoadingIndicator from '@/components/loading-indicator'
import ModelMediaPreview from '@/components/media/model-media-preview'
import { Skeleton } from '@/components/ui/skeleton'
import DetailSidebar from '@/features/detail/detail-sidebar'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import React, { Suspense } from 'react'

type Props = {
  id: string
  modelSSRData?: ModelV2
  isModal?: boolean
}

const ModelDetail = ({ id, modelSSRData, isModal }: Props) => {
  // const { user } = useAuthState()
  const { model: modelClientData, queryKey } = useModelQuery({
    key: id,
    initialData: modelSSRData
      ? {
          model: modelSSRData,
        }
      : undefined,
  })

  const model = modelSSRData || modelClientData

  return (
    <>
      <div
        className={cn([
          `w-full flex flex-col flex-grow lg:flex-row lg:gap-4 max-h-full lg:ml-4`,
          isModal
            ? 'lg:h-[calc(100vh_-_34px)] lg:w-[calc(100dvw_-_48px)]'
            : 'lg:h-[calc(100vh_-_64px)] lg:w-[calc(100dvw_-_16px)]',
        ])}
      >
        {model?.deleted ? (
          <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
            <div className="p-1 bg-destructive/50 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
              deleted
            </div>
          </div>
        ) : null}
        {model ? (
          <ModelMediaPreview model={model} isModal={isModal} />
        ) : (
          <Skeleton className="min-h-[512px] w-full rounded-xl opacity-0 animate-fade-in" />
        )}

        <Suspense fallback={<LoadingIndicator />}>
          <DetailSidebar
            item={model}
            type={'model'}
            inModal={isModal}
            queryKey={queryKey}
            // onUpdate={() => invalidate()}
          />
        </Suspense>
      </div>
    </>
  )
}

export default ModelDetail
