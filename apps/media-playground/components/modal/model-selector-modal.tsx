'use client'

import ModelSelectorModalContent from '@/components/modal/model-selector-modal-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BaseModelName, ModelV2 } from '@edenlabs/eden-sdk'
import { PropsWithChildren, ReactNode, Suspense, useRef } from 'react'
import { toast } from 'sonner'

type Props = {
  title?: ReactNode
  description?: ReactNode
  className?: string
  trigger?: ReactNode
  currentValue: string
  base_model?: BaseModelName
  onChange: (id: string) => void
} & PropsWithChildren

const ModelSelectorModal = ({
  title,
  description,
  className,
  base_model,
  onChange,
}: Props) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleOnChange = (model: ModelV2) => {
    onChange(model._id)

    toast.info(`Model selected`, {
      description: (
        <div className="text-xs text-foreground">
          <div>
            {model.name} - {model.args.concept_mode}
          </div>
          <div>{model.args.sd_model_version}</div>
        </div>
      ),
      dismissible: true,
      richColors: true,
    })

    //@todo: fix this hackish way to close the modal by utilizing state for open,onOpenChange on the dialog
    triggerRef.current?.click()
  }

  return (
    <Dialog>
      <DialogTrigger ref={triggerRef} asChild>
        <Button type="button" variant="outline" className="!mt-0">
          Select model
        </Button>
      </DialogTrigger>
      <DialogContentScrollable
        className={cn([`overflow-x-hidden flex flex-col max-w-7xl`, className])}
      >
        <DialogHeader className="mt-4">
          <div className="flex gap-4 items-center">
            <DialogTitle className="py-2">{title}</DialogTitle>
            <Badge variant="secondary">{base_model}</Badge>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Suspense
          fallback={<Skeleton className="h-10 pt-0.5 w-[270px] mb-4" />}
        >
          <ModelSelectorModalContent
            base_model={base_model}
            onChange={handleOnChange}
          />
        </Suspense>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default ModelSelectorModal
