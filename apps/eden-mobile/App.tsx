import { Colors } from './src/constants/theme'
import { useColorScheme } from './src/hooks/use-color-scheme'
import Navigator from './src/navigator'
import Providers from './src/providers'
import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function App() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

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
      <NavigationContainer>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar
            style={colorScheme === 'light' ? 'light' : 'dark'}
            backgroundColor={colors.background}
            translucent={false}
          />
          <SafeAreaView style={{ flex: 1 }}>
            <Navigator />
          </SafeAreaView>
        </View>
      </NavigationContainer>
    </Providers>
  )
}
