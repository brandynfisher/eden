import { useMe } from '@/hooks/auth/useMe'
import { useSettings } from '@/hooks/useSettings'
import { UserContextType } from '@/providers/UserProvider'
import { useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const useClerkUserState = () => {
  const router = useRouter()
  const { isSignedIn, userId: clerkUid } = useAuth()
  const { signOut, openSignIn } = useClerk()
  const isAuthenticated = isSignedIn || false
  const userId = clerkUid || null
  const { user, balance, pendingTasks, refetchMe } = useMe({ isAuthenticated })

  const authenticate = async () => {
    if (!isAuthenticated) {
      openSignIn(undefined)
    }
  }

  const logout = async () => {
    if (isAuthenticated) {
      await signOut()
    }

    await router.push('/')
  }

  // reset user state on disconnect
  useEffect(() => {
    refetchMe()
  }, [isAuthenticated])

  const { settings, updateSetting } = useSettings()

  const userState: UserContextType = {
    isAuthenticating: false,
    authError: null,
    isAuthenticated,
    userId,
    authenticate,
    logout,
    mannaBalance: balance,
    pendingTasks,
    settings,
    updateSetting,
    user: user ? user : undefined,
    refetchMe,
    featureFlags: user?.featureFlags || [],
  }
  return userState
}
