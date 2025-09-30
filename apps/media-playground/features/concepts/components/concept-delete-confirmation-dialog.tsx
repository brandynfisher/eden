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
import { Concept2 } from '@edenlabs/eden-sdk'

interface ConceptDeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  concept: Concept2 | null
}

const ConceptDeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  concept,
}: ConceptDeleteConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  if (!concept) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Concept</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{concept.name}&quot;? This
            action cannot be undone. The concept and all its training images
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete Concept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConceptDeleteConfirmationDialog
