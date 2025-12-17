import { ONBOARDING_COMPLETE_KEY } from '@/constants/storage'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/permissions.styles'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface PermissionItem {
  id: string
  title: string
  description: string
  icon: string
  requestPermission: () => Promise<boolean>
}

const permissions: PermissionItem[] = [
  {
    id: 'notifications',
    title: 'Notifications',
    description:
      'Stay updated with new creations, collaborations, and important updates from your AI spirits.',
    icon: '🔔',
    requestPermission: async () => {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        return finalStatus === 'granted'
      } catch (error) {
        console.error('Error requesting notification permission:', error)
        return false
      }
    },
  },
  {
    id: 'camera',
    title: 'Camera Access',
    description:
      'Capture photos and videos to create and share your artistic creations.',
    icon: '📷',
    requestPermission: async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        return status === 'granted'
      } catch (error) {
        console.error('Error requesting camera permission:', error)
        return false
      }
    },
  },
  {
    id: 'storage',
    title: 'Storage Access',
    description:
      'Upload media files from your device to create and share your artistic works.',
    icon: '💾',
    requestPermission: async () => {
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync()
        return status === 'granted'
      } catch (error) {
        console.error('Error requesting storage permission:', error)
        return false
      }
    },
  },
]

export default function Permissions() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const insets = useSafeAreaInsets()
  const styles = createStyles(theme, insets.bottom)
  const navigation = useNavigation<NavigationProp>()
  const [isLoading, setIsLoading] = useState(false)

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true')

    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomTabs' }],
    })
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      // Request all permissions
      const permissionResults = await Promise.all(
        permissions.map(async permission => {
          try {
            const granted = await permission.requestPermission()
            return { id: permission.id, granted }
          } catch (error) {
            console.error(
              `Error requesting ${permission.id} permission:`,
              error,
            )
            return { id: permission.id, granted: false }
          }
        }),
      )

      // Check if all permissions were granted
      const deniedPermissions = permissionResults.filter(
        result => !result.granted,
      )

      if (deniedPermissions.length) {
        console.log('Some permissions were denied, continuing anyway:', deniedPermissions)
      }

      await completeOnboarding()
    } catch (error) {
      console.error('Error during permission setup:', error)
      // Show error alert and don't navigate
      Alert.alert(
        'Error',
        'An error occurred while requesting permissions. Please try again.',
        [{ text: 'OK' }],
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Permissions & Access</Text>
          <Text style={styles.subtitle}>
            To provide you with the best experience, Eden may request certain
            permissions. You can manage these in your device settings at any
            time.
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {permissions.map(permission => (
            <View key={permission.id} style={styles.permissionItem}>
              <Text style={styles.permissionIcon}>{permission.icon}</Text>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>{permission.title}</Text>
                <Text style={styles.permissionDescription}>
                  {permission.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={isLoading}
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors[theme].textInverse} />
            ) : (
              <Text style={styles.continueButtonText}>Continue to Eden</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            You can change these permissions anytime in your device settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
