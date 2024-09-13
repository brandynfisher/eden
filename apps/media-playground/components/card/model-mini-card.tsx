'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useModelQuery } from '@/hooks/query/use-model-query'
import customImageLoader from '@/image-loader'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React, { PropsWithChildren } from 'react'

type Props = {
  modelId: ModelV2['_id']
  className?: string
} & PropsWithChildren

const ModelMiniCard = ({ modelId, children, className }: Props) => {
  const { model } = useModelQuery({ key: modelId })

  if (!modelId) {
    return null
  }

  return (
    <div
      className={cn([
        'flex gap-2 items-center bg-accent border border-border rounded-lg mb-2 h-16 overflow-hidden',
        className,
      ])}
    >
      {!model ? (
        <>
          <Skeleton className="h-16 w-16" />
          <div className="text-xs flex flex-col h-full w-full space-y-0.5 mr-2 justify-center">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </>
      ) : (
        <>
          <Image
            loader={customImageLoader}
            src={model?.thumbnail}
            alt={model?.name}
            width={64}
            height={64}
          />
          <div className="text-xs flex flex-col h-full py-1">
            <div className="flex">
              {model.name}
              <Badge className="ml-auto h-4 px-2" variant="outline">
                {model.args.concept_mode}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-auto">
              <div>{model.user.username}</div>
              <div>{model.args.sd_model_version}</div>
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  )
}

export default ModelMiniCard
