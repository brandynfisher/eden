import { useBalance } from '@/hooks/useBalance'
import { useCreator } from '@/hooks/useCreator'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useMyCollections } from '@/hooks/useMyCollections'
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
  const { creator, mutate: refetchCreator } = useCreator(userId || null)

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
    refetchCreator()
    refetchMannaBalance()
    refetchMyCharacters()
    refetchMyCollections()
  }, [isAuthenticated])
  const { settings, updateSetting } = useSettings()

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
    settings,
    updateSetting,
    user: creator ? creator : undefined,
    refetch: {
      mannaBalance: refetchMannaBalance,
      characters: refetchMyCharacters,
      collections: refetchMyCollections,
      user: refetchCreator,
    },
    featureFlags: creator?.featureFlags || [],
  }
  return user
}
