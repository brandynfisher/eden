'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import useLocalStorage from '@/hooks/use-local-storage'
import { XCircleIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React from 'react'

const BANNER_KEY = 'transitionBannerDismissed'

const TransitionBanner: React.FC = () => {
  const { isSignedIn } = useAuthState()
  const pathname = usePathname()

  //hide banner on /chat/... - quick and dirty fix to not screw with full height chat layout
  const shouldShowTransitionBanner = !pathname?.startsWith('/chat')

  const [isDismissed, setIsDismissed] = useLocalStorage(BANNER_KEY, false)

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  if (
    !isSignedIn ||
    !shouldShowTransitionBanner ||
    isDismissed.isLoading ||
    isDismissed.data
  ) {
    return null
  }

  return (
    <div className="w-full p-4 bg-muted relative max-h-[80px]">
      <p className="text-xs md:text-sm text-center">
        <span className="font-semibold">Welcome to the new Eden!</span> For
        those used to our old app, please see our{' '}
        <a
          href="https://docs.eden.art/guides/transition"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          transition guide
        </a>
        .
      </p>
      <button
        className="absolute top-[50%] right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-4"
        onClick={handleDismiss}
      >
        <XCircleIcon size={16} />
      </button>
    </div>
  )
}

export default TransitionBanner
