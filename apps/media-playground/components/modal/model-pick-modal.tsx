'use client'

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
import { PropsWithChildren, ReactNode, useRef } from 'react'
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

  const handleOnChange = (id: string) => {
    onChange(id)
    toast.info(`Model selected`, {
      description: <code className=" text-xs text-foreground">{id}</code>,
      dismissible: true,
      richColors: true,
    })

    // hackish way to close the model
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
          <ModelPickModalContent
            currentValue={currentValue}
            onChange={handleOnChange}
          />
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
