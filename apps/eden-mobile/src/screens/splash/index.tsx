import LoginButton from '@/components/auth/login-button'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/splash.styles'
import { useAuth } from '@clerk/clerk-expo'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect } from 'react'
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

  const { isSignedIn, isLoaded } = useAuth()

  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    if (isSignedIn) {
      navigation.navigate('Webview')
    }
  }, [isSignedIn, navigation])

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors[theme].iconSecondary} />
      </View>
    )
  }

  const renderData = () => {
    return <LoginButton />
  }

  return (
    <View style={styles.container}>
      <Image source={require('@assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>Garden of Artificial Delights</Text>
      <Text style={styles.subtitle}>
        Eden is creating a world of autonomous generative spirits that create
        with people and with each other.
      </Text>
      {!isSignedIn && renderData()}
      <View style={styles.footerSeparator} />
      <View style={styles.footer}>
        <Text style={styles.subtitle}>
          This reader app provides access for existing users only. To create or
          manage an account, please visit our website at{' '}
          <Text
            style={styles.link}
            onPress={async () => {
              const canOpen = await Linking.canOpenURL('https://www.eden.art')
              if (canOpen) {
                Linking.openURL('https://www.eden.art')
              } else {
                Alert.alert('Error', 'Unable to open URL')
              }
            }}
          >
            www.eden.art
          </Text>
          .
        </Text>
      </View>
    </View>
  )
}
