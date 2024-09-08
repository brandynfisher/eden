'use client'

import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useModelQuery } from '@/hooks/query/use-model-query'
import customImageLoader from '@/image-loader'
import { X } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  onChange: (newVal: string | undefined) => void
  value: string
}

const ModelSelector = ({ onChange, value }: Props) => {
  const { model, isLoading } = useModelQuery({ key: value, enabled: !!value })
  const router = useRouter()
  const pathname = usePathname()

  const handleRemoveModelSelection = () => {
    router.push(pathname, { scroll: false })
    onChange('')
  }

  return (
    <div>
      {isLoading || model ? (
        <div className="flex gap-2 items-center bg-accent border border-border rounded-lg mb-2 h-16 overflow-hidden">
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
              <Button
                size="sm"
                variant="outline"
                className="ml-auto mr-2"
                onClick={handleRemoveModelSelection}
              >
                <X size={20} />
              </Button>
            </>
          )}
        </div>
      ) : null}

      <ModelSelectorModal
        className="p-4 md:p-8 w-full"
        title="Select model"
        description="Pick a model to use as a lora"
        currentValue={value}
        onChange={onChange}
      />
    </div>
  )
}

export default ModelSelector
