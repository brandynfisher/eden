'use client'

import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useRouter } from 'next/navigation'
import { PropsWithChildren } from 'react'

type Props = {
  title?: string
  description?: string
} & PropsWithChildren

const FullHeightModal = ({ title, description, children }: Props) => {
  const router = useRouter()

  const handleOpenChange = () => {
    router.back()
  }

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogContentScrollable className="min-h-[calc(100dvh_-_32px)] h-fit md:h-[calc(100dvh_-_32px)] md:w-[calc(100dvw_-_32px)] overflow-x-hidden">
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

export default FullHeightModal
