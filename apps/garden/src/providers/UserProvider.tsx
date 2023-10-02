import { useWeb3UserState } from '@/hooks/auth/useWeb3UserState'
import { SettingName, Settings } from '@/hooks/useSettings'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Character } from '@edenlabs/eden-sdk'
import { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isAuthenticating: boolean
  isAuthenticated: boolean
  authError: string | null
  authenticate: () => Promise<void>
  logout: () => Promise<void>
  userId: string | null
  mannaBalance?: number
  characters?: Character[]
  collections?: Collection[]
  refetch: {
    mannaBalance: VoidFunction
    characters: VoidFunction
    collections: VoidFunction
    user: VoidFunction
  }
  settings?: Settings
  updateSetting: (settingName: SettingName, newValue: number | 'auto') => void
  user?: Creator
  featureFlags: string[]
}

const defaultUserState: UserContextType = {
  isAuthenticating: false,
  isAuthenticated: false,
  authError: null,
  authenticate: () => {
    return new Promise<void>(resolve => resolve())
  },
  logout: async () => {
    return new Promise<void>(resolve => resolve())
  },
  userId: null,
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
    user: () => {
      return null
    },
  },
  settings: undefined,
  updateSetting: () => {
    return null
  },
  user: undefined,
  featureFlags: [],
}

export const UserContext = createContext<UserContextType>(defaultUserState)

function UserProvider({ children }: PropsWithChildren) {
  const userState = useWeb3UserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
