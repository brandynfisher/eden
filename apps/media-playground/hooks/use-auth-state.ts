'use client'

import { useMe } from '@/hooks/use-me'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'

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
    isLoading,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const verifyAuth = useCallback(async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn({
      appearance: { baseTheme: dark },
      forceRedirectUrl: pathname,
    })
    return false
  }, [isSignedIn, openSignIn, pathname])

  return {
    verifyAuth,
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    isSignedIn,
    isLoading,
    refetchMe: invalidate,
  }
}
