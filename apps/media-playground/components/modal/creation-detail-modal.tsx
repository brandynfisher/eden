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

const CreationDetailModal = ({ children }: PropsWithChildren) => {
  const router = useRouter()

  const handleOpenChange = () => {
    router.back()
  }

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogContentScrollable className="min-h-[calc(100dvh_-_64px)] h-fit">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Modal Header Title</DialogTitle>
            <DialogDescription>Modal Header Description</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        {children}
      </DialogContentScrollable>
    </Dialog>
  )
}

export default CreationDetailModal
