'use client'

import { Player } from '@/components/player'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import { PlayerProvider, usePlayer } from '@/contexts/player-context'
import { useCollectionCreations } from '@/hooks/use-collection-creations'
import { Loader2, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function PlayerPage() {
  const router = useRouter()
  const { id } = useParams()

  const { creations, isLoading: isCollectionLoading } = useCollectionCreations(
    id as string,
  )

  if (isCollectionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!creations.length) {
    return null
  }

  return (
    <PlayerProvider initialItems={creations}>
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
