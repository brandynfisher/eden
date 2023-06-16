import { useUserState } from '@/hooks/useUserState'
import { Creation } from '@eden-labs/eden-sdk'
import { Agent } from '@eden-labs/eden-sdk'
import React, { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isConnected: boolean
  isConnecting: boolean
  isAuthenticating: boolean
  isAuthenticated: boolean
  authenticate: () => void
  logout: () => void
  address?: `0x${string}`
  mannaBalance?: number
  creations?: Creation[]
  characters?: Agent[]
  refetch: {
    mannaBalance: VoidFunction
    characters: VoidFunction
    reactions: VoidFunction
    bookmarks: VoidFunction
  }
  reactions: {
    praises?: string[]
    burns?: string[]
  }
  bookmarks?: string[]
}

const defaultUserState: UserContextType = {
  isConnected: false,
  isConnecting: false,
  isAuthenticating: false,
  isAuthenticated: false,
  authenticate: () => {
    return null
  },
  logout: () => {
    return null
  },
  address: undefined,
  mannaBalance: undefined,
  creations: undefined,
  characters: undefined,
  refetch: {
    mannaBalance: () => {
      return null
    },
    characters: () => {
      return null
    },
    reactions: () => {
      return null
    },
    bookmarks: () => {
      return null
    },
  },
  reactions: {
    praises: undefined,
    burns: undefined,
  },
  bookmarks: undefined,
}

export const UserContext = createContext<UserContextType>(defaultUserState)

function UserProvider({ children }: PropsWithChildren) {
  const userState = useUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
