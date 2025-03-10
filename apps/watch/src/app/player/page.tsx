'use client'

import { collectionData } from '../../collection.data'
import { Player } from '@/components/player'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PlayerPage() {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(true)
  const [imageDuration, setImageDuration] = useState(15)
  const [showSettings, setShowSettings] = useState(true)

  // Check if collection has any videos
  const hasVideos = collectionData.some(item =>
    item.mediaAttributes.mimeType.startsWith('video'),
  )

  // If no videos, we can skip settings
  if (!hasVideos && showSettings) {
    setShowSettings(false)
  }

  const handleEnableSound = () => {
    setIsMuted(false)
    setShowSettings(false)
  }

  const handleKeepMuted = () => {
    setIsMuted(true)
    setShowSettings(false)
  }

  const handleImageDurationChange = (duration: number) => {
    setImageDuration(duration)
  }

  const handleSettingsClose = (open: boolean) => {
    if (!open) {
      router.back()
    }
  }

  if (showSettings) {
    return (
      <SettingsDialog
        open={true}
        onOpenChange={handleSettingsClose}
        onEnableSound={handleEnableSound}
        onKeepMuted={handleKeepMuted}
        onImageDurationChange={handleImageDurationChange}
        defaultImageDuration={imageDuration}
      />
    )
  }

  return (
    <main className="w-screen h-screen bg-black relative">
      <Player
        items={collectionData}
        initialMuted={isMuted}
        imageDuration={imageDuration}
      />

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
