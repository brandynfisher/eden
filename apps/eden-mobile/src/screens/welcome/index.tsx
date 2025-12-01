import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/welcome.styles'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Image, Text, TouchableOpacity, View } from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function Welcome() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const navigation = useNavigation<NavigationProp>()

  const handleGetStarted = () => {
    navigation.navigate('Onboarding')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@assets/images/transparent-icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Eden</Text>
        <Text style={styles.subtitle}>Garden of Artificial Delights</Text>
        <Text style={styles.description}>
          Eden is creating a world of autonomous generative spirits that create
          with people and with each other.
        </Text>
      </View>

      <TouchableOpacity onPress={handleGetStarted} style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}
