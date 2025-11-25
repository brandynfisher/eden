import SignInModal from './sign-in-modal'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/login-button.styles'
import { useAuth } from '@clerk/clerk-expo'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useState } from 'react'
import { Text, TouchableOpacity } from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function LoginButton() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

  const navigation = useNavigation<NavigationProp>()

  const { isSignedIn } = useAuth()
  const [modalVisible, setModalVisible] = useState(false)

  const handlePress = () => {
    if (!isSignedIn) {
      setModalVisible(true)
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <SignInModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'BottomTabs' }],
            })
          }, 500)
        }}
      />
    </>
  )
}
