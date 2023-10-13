import { useClerkUserState } from '@/hooks/auth/useClerkUserState'
import { SettingName, Settings } from '@/hooks/useSettings'
import { Collection, Creator, Task } from '@edenlabs/eden-sdk'
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
  pendingTasks?: Task[]
  refetch: {
    mannaBalance: VoidFunction
    characters: VoidFunction
    collections: VoidFunction
    user: VoidFunction
    pendingTasks: VoidFunction
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
  pendingTasks: undefined,
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
    pendingTasks: () => {
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
  const userState = useClerkUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
