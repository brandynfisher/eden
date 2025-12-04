import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/logout-button.styles'
import { useClerk } from '@clerk/clerk-expo'
import { Text, TouchableOpacity } from 'react-native'

export default function LogoutButton() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const { signOut } = useClerk()

  const handlePress = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  )
}
