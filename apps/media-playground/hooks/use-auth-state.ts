'use client'

import { useMe } from '@/hooks/use-me'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { usePathname } from 'next/navigation'

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    invalidate,
  } = useMe({ isAuthenticated: !!isSignedIn })

  // We can detect if we're returning from auth by checking if auth is loaded and user just signed in
  const isPostAuthRedirect = isLoaded && isSignedIn

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
    isPostAuthRedirect,
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    isSignedIn,
    refetchMe: invalidate,
  }
}
