import { useAuth } from '@/hooks/useAuth'
import { useBalance } from '@/hooks/useBalance'
import { useMyCreations } from '@/hooks/useMyCreations'
import { UserContextType } from '@/providers/UserProvider'
import { useAccount } from 'wagmi'

export const useUserState = () => {
  const { address, isConnected, isConnecting } = useAccount()
  const { isAuthenticated, isAuthenticating, authenticate, logout } = useAuth()
  const { manna } = useBalance({ isAuthenticated })
  const { creations } = useMyCreations({
    userId: address || '',
    isAuthenticated,
  })

  const user: UserContextType = {
    isConnected,
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
