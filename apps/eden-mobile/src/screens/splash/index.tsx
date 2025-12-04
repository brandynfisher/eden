import { ONBOARDING_COMPLETE_KEY } from '@/constants/storage'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/splash.styles'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Text,
  View,
} from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function Splash() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

  const navigation = useNavigation<NavigationProp>()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  useEffect(() => {
    const checkOnboardingAndNavigate = async () => {
      try {
        const onboardingComplete = await SecureStore.getItemAsync(
          ONBOARDING_COMPLETE_KEY,
        )

        if (!onboardingComplete) {
          // Onboarding not complete, navigate to Welcome
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          })
        } else {
          // Onboarding complete, navigate to BottomTabs
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTabs' }],
          })
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, show onboarding to be safe
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboardingAndNavigate()
  }, [navigation])

  if (isCheckingOnboarding) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors[theme].iconSecondary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image source={require('@assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Garden of Artificial Delights</Text>
      <Text style={styles.subtitle}>
        Eden is creating a world of autonomous generative spirits that create
        with people and with each other.
      </Text>
      <View style={styles.footerSeparator} />
    </View>
  )
}
