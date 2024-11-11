'use client'

import useLocalStorage from '../hooks/use-local-storage'
import DiscordIcon from '@/components/icons/discord'
import { Button } from '@/components/ui/button'
import { XCircleIcon } from 'lucide-react'
import React from 'react'

const DiscordBanner: React.FC = () => {
  const [bannerDismissed, setBannerDismissed, isLoading] = useLocalStorage<
    number | null
  >('discordBannerDismissed', null)

  const handleDismiss = () => {
    setBannerDismissed(Date.now())
  }

  if (isLoading || bannerDismissed) {
    return null
  }

  return (
    <div className="w-full p-4 bg-[#5865F2] shadow-lg">
      <p className="text-xl font-semibold">Join the Eden community!</p>
      <p className="text-sm font-medium mt-2">
        Connect with fellow AI artists on our Discord server. Share your
        creations, get inspired by others, and help us shape Eden.art!
      </p>
      <div className="flex items-center gap-4 mt-4">
        <Button
          size="sm"
          className="gap-x-2 font-semibold text-[#5865F2]"
          variant="default"
          onClick={() => {
            window.open('https://discord.com/invite/4dSYwDT', '_blank')
            handleDismiss()
          }}
        >
          <DiscordIcon size={16} />
          Join Discord
        </Button>
        <Button
          size="sm"
          className="gap-x-2"
          variant="ghost"
          onClick={handleDismiss}
        >
          <XCircleIcon size={16} />
          Dismiss
        </Button>
      </div>
    </div>
  )
}

export default DiscordBanner
