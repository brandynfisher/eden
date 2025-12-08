import { ONBOARDING_COMPLETE_KEY } from '@/constants/storage'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { RootStackParamList } from '@/navigator'
import { BottomTabsParamList } from '@/navigator/bottom-tabs'
import createStyles from '@/styles/settings.styles'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { CompositeNavigationProp } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import * as StoreReview from 'expo-store-review'
import { useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Linking,
  Platform,
  SectionList,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>

export default function Settings() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const navigation = useNavigation<NavigationProp>()
  const colors = Colors[theme]

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { isSignedIn } = useAuth()

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

  const handleResetWebview = () => {
    const resetToken = Date.now()
    navigation.navigate('Webview', { resetToken })
  }

  const handleResetWebview = () => {
    const resetToken = Date.now()
    navigation.navigate('Webview', { resetToken })
  }

  const handleResetOnboarding = async () => {
    try {
      await SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY)
      const rootNav = navigation.getParent()?.getParent?.()
      rootNav?.reset({
        index: 0,
        routes: [{ name: 'Welcome' as keyof RootStackParamList }],
      })
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      Alert.alert('Error', 'Failed to reset onboarding state.')
    }
  }

  const handleNotificationPreferences = () => {
    navigation.getParent()?.navigate('NotificationPreferences')
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

  type SettingItem = {
    id: string
    title: string
    description?: string
    type: 'switch' | 'action' | 'action-icon'
    onPress?: () => void
    value?: boolean
    icon?: keyof typeof Ionicons.glyphMap
    disabled?: boolean
  }

  type SettingSection = {
    title?: string
    data: SettingItem[]
  }

  const sections: SettingSection[] = [
    {
      data: [
        {
          id: 'notifications',
          title: 'Notifications',
          description:
            'Receive notifications about new creations, collaborations, and important updates.',
          type: 'switch',
          value: notificationsEnabled,
        },
        ...(notificationsEnabled
          ? [
              {
                id: 'notification-preferences',
                title: 'Notification Preferences',
                description: `Customize which types of notifications you want to receive. ${
                  isSignedIn ? '' : '(Login required)'
                }`,
                type: 'action' as const,
                onPress: handleNotificationPreferences,
              },
            ]
          : []),
        {
          id: 'rate-app',
          title: 'Rate App',
          description:
            'Help us improve by rating your experience in the App Store or Play Store.',
          type: 'action',
          onPress: handleRequestReview,
        },
      ],
    },
    {
      data: [
        {
          id: 'reset-webview',
          title: 'Reset Webview',
          description: 'Reload the embedded Eden site if it gets stuck.',
          type: 'action-icon',
          icon: 'refresh',
          onPress: handleResetWebview,
        },
      ] as SettingItem[],
    },
    {
      data: [
        {
          id: 'reset-onboarding',
          title: 'Reset Onboarding',
          description: 'Restart the intro flow and clear onboarding progress.',
          type: 'action-icon',
          icon: 'refresh',
          onPress: handleResetOnboarding,
        },
      ] as SettingItem[],
    },
  ]

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: SettingItem
    index: number
    section: SettingSection
  }) => {
    const isFirst = index === 0
    const isLast = index === section.data.length - 1
    const itemStyle = [
      styles.settingItem,
      isFirst && styles.settingItemFirst,
      isLast && styles.settingItemLast,
      Platform.OS === 'ios' && styles.settingItemIOS,
      Platform.OS === 'android' && styles.settingItemAndroid,
    ]

    if (item.type === 'switch') {
      const isMainNotificationToggle = item.id === 'notifications'
      const handleToggle = isMainNotificationToggle
        ? handleNotificationToggle
        : () => {}

      return (
        <View style={itemStyle}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.settingDescription}>{item.description}</Text>
            )}
          </View>
          {!isLoading && (
            <Switch value={item.value} onValueChange={handleToggle} />
          )}
        </View>
      )
    }

    if (item.type === 'action-icon') {
      return (
        <TouchableOpacity
          style={itemStyle}
          onPress={item.onPress}
          activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
        >
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.icon && (
            <Ionicons
              name={item.icon}
              size={Platform.OS === 'ios' ? 18 : 20}
              color={colors.textTertiary}
            />
          )}
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        style={itemStyle}
        onPress={item.onPress}
        activeOpacity={Platform.OS === 'ios' ? 0.6 : 0.7}
      >
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.settingDescription}>{item.description}</Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={Platform.OS === 'ios' ? 16 : 20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = ({ section }: { section: SettingSection }) => {
    if (!section.title) return null
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    )
  }

  const renderSectionFooter = () => {
    if (Platform.OS === 'ios') {
      return <View style={styles.sectionFooter} />
    }
    return null
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={
          Platform.OS === 'android'
            ? () => <View style={styles.separator} />
            : undefined
        }
      />
    </View>
  )
}
