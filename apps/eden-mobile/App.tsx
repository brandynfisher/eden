import { Colors } from './src/constants/theme'
import AgentsList from './src/features/agents/agents-list'
import { useColorScheme } from './src/hooks/use-color-scheme'
import Providers from './src/providers'
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
    'Inter-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter_18pt-Bold.ttf'),
    'Inter-Italic': require('./assets/fonts/Inter_18pt-Italic.ttf'),
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          style={colorScheme === 'dark' ? 'light' : 'dark'}
          backgroundColor={colors.background}
          translucent={false}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <AgentsList />
        </SafeAreaView>
      </View>
    </Providers>
  )
}
