'use client'

import { collectionData } from '../../collection.data'
import { Player } from '@/components/player'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import { PlayerProvider, usePlayer } from '@/contexts/player-context'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PlayerPage() {
  const router = useRouter()

  return (
    <PlayerProvider initialItems={collectionData}>
      <PlayerContent router={router} />
    </PlayerProvider>
  )
}

function PlayerContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const { showSettings } = usePlayer()

  const handleSettingsClose = (open: boolean) => {
    if (!open) {
      router.back()
    }
  }

  if (showSettings) {
    return <SettingsDialog open={true} onOpenChange={handleSettingsClose} />
  }

  return (
    <main className="w-screen h-screen bg-black relative">
      <Player />

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
