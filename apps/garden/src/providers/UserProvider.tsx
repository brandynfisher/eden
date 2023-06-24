import { SettingName, Settings } from '@/hooks/useSettings'
import { useUserState } from '@/hooks/useUserState'
import { Collection, Creation } from '@eden-labs/eden-sdk'
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
  collections?: Collection[]
  refetch: {
    mannaBalance: VoidFunction
    characters: VoidFunction
    collections: VoidFunction
  }
  settings?: Settings
  updateSetting: (settingName: SettingName, newValue: number) => void
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
  collections: undefined,
  refetch: {
    mannaBalance: () => {
      return null
    },
    characters: () => {
      return null
    },
    collections: () => {
      return null
    },
  },
  settings: undefined,
  updateSetting: () => {
    return null
  },
}

export const UserContext = createContext<UserContextType>(defaultUserState)

function UserProvider({ children }: PropsWithChildren) {
  const userState = useUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
