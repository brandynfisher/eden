'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Volume2 } from 'lucide-react'

interface SoundPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnableSound: () => void
  onKeepMuted: () => void
}

export function SoundPermissionDialog({
  open,
  onOpenChange,
  onEnableSound,
  onKeepMuted,
}: SoundPermissionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Sound?</AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to enable sound for all videos in this collection?
            You can change this later in the player.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onKeepMuted}>
            Keep Muted
          </Button>
          <Button onClick={onEnableSound} className="gap-2">
            <Volume2 className="size-4" />
            Enable Sound
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
