import { useBalance } from '@/hooks/useBalance'
import { useCreator } from '@/hooks/useCreator'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useMyCollections } from '@/hooks/useMyCollections'
import { usePendingTasks } from '@/hooks/usePendingTasks'
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
  const { manna, refetchMannaBalance } = useBalance({ isAuthenticated })
  const { characters, refetchMyCharacters } = useMyCharacters({
    userId,
    isAuthenticated,
  })
  const { collections, refetchMyCollections } = useMyCollections({
    userId,
    isAuthenticated,
  })
  const { pendingTasks, refetchPendingTasks } = usePendingTasks({
    isAuthenticated,
  })
  const { creator, mutate: refetchCreator } = useCreator(userId || null)

  const reloadUserState = () => {
    refetchCreator()
    refetchMannaBalance()
    refetchMyCharacters()
    refetchMyCollections()
    refetchPendingTasks()
  }

  const authenticate = async () => {
    if (!isAuthenticated) {
      await openSignIn(undefined)
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
    reloadUserState()
  }, [isAuthenticated])

  const { settings, updateSetting } = useSettings()

  // refetch data on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reloadUserState()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const user: UserContextType = {
    isAuthenticating: false,
    authError: null,
    isAuthenticated,
    userId,
    authenticate,
    logout,
    mannaBalance: manna,
    characters,
    collections,
    pendingTasks,
    settings,
    updateSetting,
    user: creator ? creator : undefined,
    refetch: {
      mannaBalance: refetchMannaBalance,
      characters: refetchMyCharacters,
      collections: refetchMyCollections,
      user: refetchCreator,
      pendingTasks: refetchPendingTasks,
    },
    featureFlags: creator?.featureFlags || [],
  }
  return user
}
