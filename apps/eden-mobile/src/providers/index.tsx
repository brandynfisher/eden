import { ClerkProviderWrapper } from './clerk-provider'
import { NotificationProvider } from './notification-provider'
import SsoCallbackHandler from '@/components/auth/sso-callback-handler'
import { useColorScheme } from '@/hooks/use-color-scheme'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { PropsWithChildren } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function Providers({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ClerkProviderWrapper>
          <NotificationProvider>
            <SsoCallbackHandler />
            {children}
          </NotificationProvider>
        </ClerkProviderWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
