import { Colors } from './src/constants/theme'
import { useColorScheme } from './src/hooks/use-color-scheme'
import Navigator from './src/navigator'
import Providers from './src/providers'
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

function AppContent() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const navTheme =
    colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme

  const insets = useSafeAreaInsets()

  return (
    <NavigationContainer theme={navTheme}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        }}
      >
        <Navigator />
      </View>
    </NavigationContainer>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': require('@assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('@assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('@assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('@assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Light': require('@assets/fonts/SpaceGrotesk-Light.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
