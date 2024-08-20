'use client'

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
import { PropsWithChildren, ReactNode } from 'react'

type Props = {
  title?: string
  description?: string
  className?: string
  trigger?: ReactNode
} & PropsWithChildren

const ModelPickModal = ({ title, description, children, className }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
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
          {children}
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
