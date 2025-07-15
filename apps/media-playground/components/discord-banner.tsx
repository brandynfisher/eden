'use client'

import DiscordAltIcon from '@/components/icons/discord-alt'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import useLocalStorage from '@/hooks/use-local-storage'
import { ArrowRight, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React from 'react'

const BANNER_KEY = 'discordBannerDismissed-v2'
const LEGACY_BANNER_KEY = 'discordBannerDismissed'

const DiscordBanner: React.FC = () => {
  const { isSignedIn } = useAuthState()
  const pathname = usePathname()

  //hide banner on /chat/... - quick and dirty fix to not screw with full height chat layout
  const shouldShowDiscordBanner =
    !pathname?.startsWith('/chat') && pathname !== '/'

  const [isDismissed, setIsDismissed] = useLocalStorage(BANNER_KEY, false)
  const [legacyDismissed] = useLocalStorage(LEGACY_BANNER_KEY, '')

  //Migrate legacy format to new format
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
    <div className="w-full relative overflow-hidden">
      {/* Striking gradient with enhanced contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700"></div>

      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>

      {/* Floating particles - hidden on mobile for cleaner look */}
      <div className="hidden sm:block absolute top-2 right-16 w-1 h-1 bg-white/40 rounded-full animate-float"></div>
      <div className="hidden sm:block absolute top-4 right-28 w-0.5 h-0.5 bg-white/30 rounded-full animate-float [animation-delay:1s]"></div>
      <div className="hidden sm:block absolute bottom-3 left-20 w-1 h-1 bg-white/35 rounded-full animate-float [animation-delay:2s]"></div>

      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 sm:hidden text-white/60 hover:text-white hover:bg-white/15 p-1.5 rounded-md transition-all duration-200 backdrop-blur-sm z-10"
        onClick={handleDismiss}
      >
        <X size={16} />
      </Button>

      {/* Main content - responsive layout */}
      <div className="relative px-4 py-5 sm:px-6 sm:py-4 md:px-8 md:py-5">
        <div className="max-w-6xl mx-auto">
          {/* Desktop layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Left content */}
            <div className="flex items-center gap-4">
              {/* Discord icon with enhanced glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-xl blur-lg animate-pulse"></div>
                <div className="relative p-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/25 shadow-lg">
                  <DiscordAltIcon size={40} />
                </div>
              </div>

              {/* Text content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                    Join the Eden community!
                  </h2>
                </div>
                <p className="text-white/85 text-xs font-medium max-w-sm leading-tight">
                  Connect with fellow AI artists on our Discord server. Share
                  your creations, get inspired by others, and help us shape
                  Eden.art!
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-white text-indigo-600 hover:text-indigo-700 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
                onClick={() => {
                  window.open('https://discord.com/invite/4dSYwDT', '_blank')
                  handleDismiss()
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 transition-opacity group-hover:opacity-90"></div>
                <div className="relative flex items-center gap-3">
                  <DiscordAltIcon size={20} />
                  <span>Join Now</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                onClick={handleDismiss}
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="sm:hidden">
            <div className="flex items-start gap-3 mb-3">
              {/* Compact Discord icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/25 rounded-lg blur-md"></div>
                <div className="mt-1 relative p-2 bg-white/15 backdrop-blur-sm rounded-lg border border-white/25">
                  <DiscordAltIcon size={24} />
                </div>
              </div>

              {/* Mobile text content */}
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Join the Eden community!
                  </h2>
                </div>
                <p className="text-white/85 text-xs font-medium leading-tight">
                  Connect with fellow AI artists on our server!
                </p>
              </div>
            </div>

            {/* Mobile action button - full width for better touch target */}
            <Button
              className="group w-full relative overflow-hidden bg-white text-indigo-700 hover:text-indigo-800 font-semibold py-2.5 rounded-lg shadow-lg active:scale-95 transition-all duration-200 border-0"
              onClick={() => {
                window.open('https://discord.com/invite/4dSYwDT', '_blank')
                handleDismiss()
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50 to-white"></div>
              <div className="relative flex items-center justify-center gap-2.5">
                <DiscordAltIcon size={18} />
                <span>Join Community</span>
                <ArrowRight
                  size={14}
                  className="transition-transform group-active:translate-x-0.5"
                />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscordBanner
