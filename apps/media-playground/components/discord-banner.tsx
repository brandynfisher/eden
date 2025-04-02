'use client'

import DiscordIcon from '@/components/icons/discord'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import useLocalStorage from '@/hooks/use-local-storage'
import { XCircleIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React from 'react'

const BANNER_KEY = 'discordBannerDismissed-v2'
const LEGACY_BANNER_KEY = 'discordBannerDismissed'

const DiscordBanner: React.FC = () => {
  const { isSignedIn } = useAuthState()
  const pathname = usePathname()

  //hide banner on /chat/... - quick and dirty fix to not screw with full height chat layout
  const shouldShowDiscordBanner =
    !pathname.startsWith('/chat') && pathname !== '/'

  const [isDismissed, setIsDismissed] = useLocalStorage(BANNER_KEY, false)
  const [legacyDismissed] = useLocalStorage(LEGACY_BANNER_KEY, '')

  // Migrate legacy format to new format
  React.useEffect(() => {
    if (
      !isDismissed.isLoading &&
      !isDismissed.data &&
      legacyDismissed.data &&
      !legacyDismissed.isLoading
    ) {
      setIsDismissed(true)
      // Also clear the legacy key to prevent any future issues
      localStorage.removeItem(LEGACY_BANNER_KEY)
    }
  }, [legacyDismissed, isDismissed, setIsDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (
    !isSignedIn ||
    !shouldShowDiscordBanner ||
    isDismissed.isLoading ||
    isDismissed.data ||
    (legacyDismissed.data && !legacyDismissed.isLoading)
  ) {
    return null
  }

  return (
    <div className="w-full p-4 bg-[#5865F2] relative">
      <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black/20 to-transparent"></div>
      <p className="text-lg md:text-xl font-semibold">
        Join the Eden community!
      </p>
      <p className="text-xs md:text-sm font-medium mt-2">
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
