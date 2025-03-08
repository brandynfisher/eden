'use client'

import { collectionData } from '../../collection.data'
import { Player } from '@/components/player'
import { SoundPermissionDialog } from '@/components/sound-permission-dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PlayerPage() {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(true)
  const [hasUserChosen, setHasUserChosen] = useState(false)

  // Check if collection has any videos
  const hasVideos = collectionData.some(item =>
    item.mediaAttributes.mimeType.startsWith('video'),
  )

  // If no videos, we can start immediately
  if (!hasVideos && !hasUserChosen) {
    setHasUserChosen(true)
  }

  const handleEnableSound = () => {
    setIsMuted(false)
    setHasUserChosen(true)
  }

  const handleKeepMuted = () => {
    setIsMuted(true)
    setHasUserChosen(true)
  }

  if (!hasUserChosen) {
    return (
      <SoundPermissionDialog
        open={true}
        onOpenChange={() => {}}
        onEnableSound={handleEnableSound}
        onKeepMuted={handleKeepMuted}
      />
    )
  }

  return (
    <main className="w-screen h-screen bg-black relative">
      <Player items={collectionData} initialMuted={isMuted} />

      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 [&_svg]:size-5"
      >
        <X />
      </Button>
    </main>
  )
}
