import { useUserState } from '@/hooks/useUserState'
import { Creation } from '@eden-labs/eden-sdk/dist/responses/CreationsGetResponse'
import React, { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isConnected: boolean
  isConnecting: boolean
  isAuthenticating: boolean
  isAuthenticated: boolean
  authenticate?: () => void
  logout?: () => void
  address?: `0x${string}`
  mannaBalance?: number
  creations?: Creation[]
}

export const UserContext = createContext<UserContextType>({
  isConnected: false,
  isConnecting: false,
  isAuthenticating: false,
  isAuthenticated: false,
  authenticate: undefined,
  logout: undefined,
  address: undefined,
  mannaBalance: undefined,
  creations: undefined,
})

function UserProvider({ children }: PropsWithChildren) {
  const userState = useUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
