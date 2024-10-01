'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useModelQuery } from '@/hooks/query/use-model-query'
import customImageLoader from '@/image-loader'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import Link from 'next/link'
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
          <Skeleton className="h-16 w-16 max-w-16 flex-shrink-0" />
          <div className="text-xs flex flex-col h-full w-full space-y-0.5 mr-2 justify-center">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </>
      ) : (
        <>
          <Link
            href={`/models/${model._id}`}
            prefetch={false}
            shallow={true}
            className="h-16 w-16"
          >
            <Image
              className="max-w-16"
              loader={customImageLoader}
              src={model?.thumbnail}
              alt={model?.name}
              width={64}
              height={64}
            />
          </Link>
          <div className="text-xs flex flex-col justify-around h-full w-full py-1">
            <Link href={`/models/${model._id}`} prefetch={false}>
              <div className="flex">
                {model.name}
                <Badge className="ml-auto h-4 px-2" variant="outline">
                  {model.args.concept_mode}
                </Badge>
              </div>
            </Link>
            <div className="text-muted-foreground flex gap-2">
              <div>
                by
                <Link
                  href={`/creators/${model.user.username}`}
                  className="ml-1 font-bold"
                  prefetch={false}
                >
                  {model.user.username}
                </Link>
              </div>
              {/*<div>{model.args.sd_model_version}</div>*/}
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  )
}

export default ModelMiniCard
