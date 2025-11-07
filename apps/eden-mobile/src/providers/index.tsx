import { ClerkProviderWrapper } from './clerk-provider'
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
        <ClerkProviderWrapper>{children}</ClerkProviderWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
