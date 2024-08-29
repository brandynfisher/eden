'use client'

import LoadingIndicator from '@/components/loading-indicator'
import ModelPickModalContent from '@/components/modal/model-pick-modal-content'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { PropsWithChildren, ReactNode, Suspense, useRef } from 'react'
import { toast } from 'sonner'

type Props = {
  title?: string
  description?: string
  className?: string
  trigger?: ReactNode
  currentValue: string
  onChange: (id: string) => void
} & PropsWithChildren

const ModelPickModal = ({
  title,
  description,
  className,
  currentValue,
  onChange,
}: Props) => {
  const triggerRef = useRef<HTMLButtonElement>(null)

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
        className={cn([`h-fit overflow-x-hidden`, className])}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Suspense fallback={<LoadingIndicator className="p-4" />}>
            <ModelPickModalContent
              currentValue={currentValue}
              onChange={handleOnChange}
            />
          </Suspense>

          <DialogFooter className="w-full mt-4 sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="ml-auto">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default ModelPickModal
