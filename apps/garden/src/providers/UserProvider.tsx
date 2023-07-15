import { SettingName, Settings } from '@/hooks/useSettings'
import { useUserState } from '@/hooks/useUserState'
import { Collection } from '@edenlabs/eden-sdk'
import { Character } from '@edenlabs/eden-sdk'
import { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isConnected: boolean
  isConnecting: boolean
  isAuthenticating: boolean
  isAuthenticated: boolean
  authError: string | null
  authenticate: () => Promise<null | undefined>
  logout: () => Promise<null | undefined>
  address?: `0x${string}`
  mannaBalance?: number
  characters?: Character[]
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
  authError: null,
  authenticate: async () => {
    return null
  },
  logout: async () => {
    return null
  },
  address: undefined,
  mannaBalance: undefined,
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
