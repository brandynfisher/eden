import { SettingName, Settings } from '@/hooks/useSettings'
import { useUserState } from '@/hooks/useUserState'
import { Collection, Creator } from '@edenlabs/eden-sdk'
import { Character } from '@edenlabs/eden-sdk'
import { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isAuthenticated: boolean
  userId: string | null
  authenticate: VoidFunction
  logout: VoidFunction
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
}

const defaultUserState: UserContextType = {
  isAuthenticated: false,
  userId: null,
  authenticate: async () => {
    return null
  },
  logout: async () => {
    return null
  },
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
}

export const UserContext = createContext<UserContextType>(defaultUserState)

function UserProvider({ children }: PropsWithChildren) {
  const userState = useUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
