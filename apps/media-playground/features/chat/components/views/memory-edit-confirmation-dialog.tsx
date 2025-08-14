'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import { FC } from 'react'

interface MemoryEditConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  isSubmitting?: boolean
}

const MemoryEditConfirmationDialog: FC<MemoryEditConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Modify Memory',
  description = 'Are you sure you want to modify this memory? Saving this will cause the original memory to be lost!',
  isSubmitting = false,
}) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="text-left">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row-reverse gap-2">
          <Button
            onClick={handleConfirm}
            variant="default"
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Save Changes
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MemoryEditConfirmationDialog