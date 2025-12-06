import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from './index'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navigate = <T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T],
) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params)
  }
}
