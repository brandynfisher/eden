'use client'

// import { UseFormReturn } from 'react-hook-form'
import ModelPickModal from '@/components/modal/model-pick-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useModelQuery } from '@/hooks/query/use-model-query'
import customImageLoader from '@/image-loader'
import { X } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

type Props = {
  // form: UseFormReturn
  onChange: (newVal: string | undefined) => void
  value: string
}

const ModelSelector = ({
  // form,
  onChange,
  value,
}: Props) => {
  const { model, isLoading } = useModelQuery({ key: value, enabled: !!value })

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
              <div className="relative w-16 h-full overflow-hidden">
                <Image
                  loader={customImageLoader}
                  src={model?.thumbnail}
                  alt={model?.name}
                  sizes={'10vw'}
                  fill={true}
                  className="object-contain w-auto h-full"
                />
              </div>
              <div className="text-xs flex flex-col h-full py-1">
                <div className="flex">
                  {model.name}
                  <Badge className="ml-auto h-4 px-2" variant="outline">
                    {model.args.concept_mode}
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-auto">
                  <div>{model.slug}</div>
                  <div>{model.args.sd_model_version}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto mr-2"
                onClick={() => onChange('')}
              >
                <X size={20} />
              </Button>
            </>
          )}
        </div>
      ) : null}

      <ModelPickModal
        className="p-8 w-full"
        title="Select model"
        description="Pick a model to use as a lora"
        currentValue={value}
        onChange={onChange}
      />
    </div>
  )
}

export default ModelSelector
