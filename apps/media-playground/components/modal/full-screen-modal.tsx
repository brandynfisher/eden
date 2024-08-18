'use client'

import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useRouter } from 'next/navigation'
import { PropsWithChildren } from 'react'

type Props = {
  title?: string
  description?: string
  className?: string
} & PropsWithChildren

const FullScreenModal = ({
  title,
  description,
  children,
  className,
}: Props) => {
  const router = useRouter()

  const handleOpenChange = () => {
    router.back()
  }

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogContentScrollable
        className={cn([`h-fit overflow-x-hidden`, className])}
      >
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        {children}
      </DialogContentScrollable>
    </Dialog>
  )
}

export default FullScreenModal
