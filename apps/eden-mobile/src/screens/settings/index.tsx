import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/settings.styles'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import * as StoreReview from 'expo-store-review'
import { useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Settings() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const colors = Colors[theme]
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkNotificationPermission()

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkNotificationPermission()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync()
      setNotificationsEnabled(status === 'granted')
    } catch (error) {
      console.error('Error checking notification permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestReview = async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync()
      if (isAvailable) {
        await StoreReview.requestReview()
      } else {
        Alert.alert(
          'Review Not Available',
          'In-app review is not available on this device. You can still rate the app in the App Store or Play Store.',
          [{ text: 'OK' }],
        )
      }
    } catch (error) {
      console.error('Error requesting review:', error)
      Alert.alert('Error', 'Failed to open review dialog.')
    }
  }

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }

        if (finalStatus === 'granted') {
          setNotificationsEnabled(true)
        } else if (finalStatus === 'denied') {
          Alert.alert(
            'Permission Denied',
            'To enable notifications, please go to your device settings and enable notifications for this app.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:')
                  } else {
                    Linking.openSettings()
                  }
                },
              },
            ],
          )
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
        Alert.alert('Error', 'Failed to request notification permission.')
      }
    } else {
      setNotificationsEnabled(false)

      try {
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:')
        } else {
          Linking.openSettings()
        }
      } catch (error) {
        console.error('Error opening settings:', error)
        Alert.alert(
          'Open Settings',
          'To disable notifications, please go to your device settings and turn off notifications for this app.',
          [{ text: 'OK' }],
        )
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications about new creations, collaborations, and
              important updates.
            </Text>
          </View>
          {!isLoading && (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={
                notificationsEnabled ? colors.textInverse : colors.textTertiary
              }
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleRequestReview}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Rate App</Text>
            <Text style={styles.settingDescription}>
              Help us improve by rating your experience in the App Store or Play
              Store.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
