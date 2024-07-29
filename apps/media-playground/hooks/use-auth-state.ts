import { useMe } from '@/hooks/use-me'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { theme } = useTheme()
  const clerkTheme = theme === 'dark' ? dark : undefined

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const verifyAuth = async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn(
      clerkTheme ? { appearance: { baseTheme: clerkTheme } } : undefined,
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
  }
}
