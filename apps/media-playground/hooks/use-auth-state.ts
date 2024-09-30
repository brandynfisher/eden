'use client'

import { useMe } from '@/hooks/use-me'
import { env } from '@/lib/config'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { resolvedTheme } = useTheme()
  const clerkTheme = resolvedTheme === 'light' ? undefined : dark

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

    openSignIn(
      clerkTheme
        ? {
            fallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
            signUpFallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
            appearance: { baseTheme: dark },
          }
        : undefined,
    )
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
