import { useAuth } from '@/hooks/useAuth'
import { useBalance } from '@/hooks/useBalance'
import { useCreator } from '@/hooks/useCreator'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useMyCollections } from '@/hooks/useMyCollections'
import { useSettings } from '@/hooks/useSettings'
import { UserContextType } from '@/providers/UserProvider'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export const useUserState = () => {
  const { address, isConnected, isConnecting } = useAccount()
  const [isDefinitelyConnected, setIsDefinitelyConnected] = useState(false)
  useEffect(() => {
    if (isConnected) {
      setIsDefinitelyConnected(true)
    } else {
      setIsDefinitelyConnected(false)
    }
  }, [address])

  const { isAuthenticated, isAuthenticating, authenticate, logout, authError } =
    useAuth()
  const { manna, refetchMannaBalance } = useBalance({ isAuthenticated })
  const { characters, refetchMyCharacters } = useMyCharacters({
    userId: address || '',
    isAuthenticated,
  })
  const { collections, refetchMyCollections } = useMyCollections({
    userId: address || '',
    isAuthenticated,
  })
  const { creator, mutate: refetchCreator } = useCreator(address || null)

  // reset user state on disconnect
  useEffect(() => {
    refetchCreator()
    refetchMannaBalance()
    refetchMyCharacters()
    refetchMyCollections()
  }, [isAuthenticated])

  const { settings, updateSetting } = useSettings()

  const user: UserContextType = {
    isConnected: isDefinitelyConnected,
    isConnecting,
    isAuthenticating,
    isAuthenticated,
    authError,
    authenticate,
    logout,
    address,
    mannaBalance: manna,
    characters,
    collections,
    refetch: {
      mannaBalance: refetchMannaBalance,
      characters: refetchMyCharacters,
      collections: refetchMyCollections,
      user: refetchCreator,
    },
    settings,
    updateSetting,
    user: creator ? creator : undefined,
  }
  return user
}
