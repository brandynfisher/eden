import { useMe } from '@/hooks/auth/useMe'
import { useSettings } from '@/hooks/useSettings'
import { UserContextType } from '@/providers/UserProvider'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const useClerkUserState = () => {
  const router = useRouter()
  const { isLoaded, isSignedIn, userId: clerkUid } = useAuth()
  const { signOut, openSignIn } = useClerk()
  const isAuthenticated = isSignedIn || false
  const userId = clerkUid || null
  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    refetchMe,
    hasMinimumSubscriptionTier,
  } = useMe({ isAuthenticated })

  const authenticate = async () => {
    if (!isAuthenticated) {
      openSignIn({
        appearance: { baseTheme: dark },
      })
    }
  }

  const logout = async () => {
    if (isAuthenticated) {
      await signOut()
    }

    await router.push('/sign-in')
  }

  const maybeAuthenticate = async () => {
    if (isAuthenticated) {
      return true
    }

    await authenticate()
    return false
  }

  // reset user state on disconnect
  useEffect(() => {
    refetchMe()
  }, [refetchMe, isAuthenticated])

  const { settings, updateSetting } = useSettings()

  const userState: UserContextType = {
    isAuthenticating: !isLoaded,
    authError: null,
    isAuthenticated,
    maybeAuthenticate,
    userId,
    authenticate,
    logout,
    mannaBalance: balance,
    mannaForeverBalance: foreverBalance,
    mannaSubscriptionBalance: subscriptionBalance,
    settings,
    updateSetting,
    user: user ? user : undefined,
    refetchMe,
    featureFlags: user?.featureFlags || [],
    hasMinimumSubscriptionTier,
  }
  return userState
}
