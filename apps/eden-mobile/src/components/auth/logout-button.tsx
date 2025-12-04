import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/logout-button.styles'
import { useClerk } from '@clerk/clerk-expo'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, TouchableOpacity } from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function LogoutButton() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const { signOut } = useClerk()

  const navigation = useNavigation<NavigationProp>()

  const handlePress = async () => {
    try {
      await signOut()
      navigation.navigate('Splash')
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
