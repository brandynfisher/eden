'use client'

import { useMe } from '@/hooks/use-me'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { usePathname } from 'next/navigation'

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    invalidate,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const verifyAuth = async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn({
      appearance: { baseTheme: dark },
      forceRedirectUrl: pathname,
    })
    return false
  }

  return {
    verifyAuth,
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    isSignedIn,
    refetchMe: invalidate,
  }
}
