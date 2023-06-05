import { useAuth } from '@/hooks/useAuth'
import { useBalance } from '@/hooks/useBalance'
import { useMyCreations } from '@/hooks/useMyCreations'
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

  const { isAuthenticated, isAuthenticating, authenticate, logout } = useAuth()
  const { manna } = useBalance({ isAuthenticated })
  const { creations } = useMyCreations({
    userId: address || '',
    isAuthenticated,
  })

  const user: UserContextType = {
    isConnected: isDefinitelyConnected,
    isConnecting,
    isAuthenticating,
    isAuthenticated,
    authenticate,
    logout,
    address,
    mannaBalance: manna,
    creations,
  }
  return user
}
