import { useClerkUserState } from '@/hooks/auth/useClerkUserState'
import { SettingName, Settings } from '@/hooks/useSettings'
import { Creator, SubscriptionTier, Task } from '@edenlabs/eden-sdk'
import { PropsWithChildren, createContext } from 'react'

export interface UserContextType {
  isAuthenticating: boolean
  isAuthenticated: boolean
  authError: string | null
  authenticate: () => Promise<void>
  logout: () => Promise<void>
  userId: string | null
  mannaBalance?: number
  pendingTasks?: Task[]
  refetchMe: VoidFunction
  settings?: Settings
  updateSetting: (settingName: SettingName, newValue: number | 'auto') => void
  user?: Creator
  featureFlags: string[]
  hasMinimumSubscriptionTier: (minimumTier: SubscriptionTier) => boolean
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
  user: undefined,
  mannaBalance: undefined,
  pendingTasks: undefined,
  refetchMe: () => {
    return null
  },
  settings: undefined,
  updateSetting: () => {
    return null
  },
  featureFlags: [],
  hasMinimumSubscriptionTier: () => {
    return false
  },
}

export const UserContext = createContext<UserContextType>(defaultUserState)

function UserProvider({ children }: PropsWithChildren) {
  const userState = useClerkUserState()

  return (
    <UserContext.Provider value={userState}>{children}</UserContext.Provider>
  )
}

export default UserProvider
