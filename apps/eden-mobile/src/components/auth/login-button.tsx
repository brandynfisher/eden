import SignInModal from './sign-in-modal'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/login-button.styles'
import { useAuth } from '@clerk/clerk-expo'
import { useState } from 'react'
import { Text, TouchableOpacity } from 'react-native'

export default function LoginButton() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

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
      />
    </>
  )
}
