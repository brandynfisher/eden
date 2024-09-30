'use client'

import { useMe } from '@/hooks/use-me'
import { env } from '@/lib/config'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    hasEden2EarlyAccess,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const verifyAuth = async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn({
      fallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
      signUpFallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
      appearance: { baseTheme: dark },
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
    hasEden2EarlyAccess,
    isSignedIn,
  }
}
