import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { config } from '@/lib/config'
import { RootStackParamList } from '@/navigator'
import createStyles from '@/styles/settings.styles'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  SectionList,
  Switch,
  Text,
  View,
} from 'react-native'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

type NotificationPreferenceKey =
  | 'new_creation'
  | 'new_message'
  | 'session_permissions'
  | 'agent_permissions'

const NOTIFICATION_KEY_MAP: Record<string, NotificationPreferenceKey> = {
  'new-creation': 'new_creation',
  'new-message': 'new_message',
  'session-permissions': 'session_permissions',
  'agent-permissions': 'agent_permissions',
}

export default function NotificationPreferences() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const colors = Colors[theme]
  const navigation = useNavigation<NavigationProp>()
  const { getToken, isSignedIn } = useAuth()
  const [notificationPreferences, setNotificationPreferences] = useState({
    new_creation: true,
    new_message: true,
    session_permissions: true,
    agent_permissions: true,
  })
  const [preferencesLoading, setPreferencesLoading] = useState(true)

  useEffect(() => {
    fetchNotificationPreferences()

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchNotificationPreferences()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const fetchNotificationPreferences = async () => {
    try {
      const token = await getToken()
      if (!token) {
        setPreferencesLoading(false)
        return
      }

      const response = await fetch(
        `${config.API_URL}/user-preferences/notifications`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setNotificationPreferences(data.notification_preferences)
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    } finally {
      setPreferencesLoading(false)
    }
  }

  const updateNotificationPreference = async (
    key: NotificationPreferenceKey,
    value: boolean,
  ) => {
    if (!isSignedIn) {
      Alert.alert('Error', 'Please sign in to update notification preferences.')
      return
    }

    const updatedPreferences = {
      ...notificationPreferences,
      [key]: value,
    }
    setNotificationPreferences(updatedPreferences)

    try {
      const token = await getToken()
      if (!token) {
        Alert.alert('Error', 'Authentication required to update preferences.')
        // Revert on error
        setNotificationPreferences(notificationPreferences)
        return
      }

      const response = await fetch(
        `${config.API_URL}/user-preferences/notifications`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notification_preferences: {
              [key]: value,
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to update preference')
      }
    } catch (error) {
      console.error('Error updating notification preference:', error)
      Alert.alert(
        'Error',
        'Failed to update notification preference. Please try again.',
      )
      // Revert on error
      setNotificationPreferences(notificationPreferences)
    }
  }

  type SettingItem = {
    id: string
    title: string
    description?: string
    type: 'switch'
    value: boolean
    disabled?: boolean
  }

  type SettingSection = {
    title?: string
    data: SettingItem[]
  }

  const sections: SettingSection[] = [
    {
      title: 'Notification Types',
      data: [
        {
          id: 'new-creation',
          title: 'New Creations',
          description:
            'Get notified when your creations are completed or started.',
          type: 'switch',
          value: notificationPreferences.new_creation,
          disabled: !isSignedIn,
        },
        {
          id: 'new-message',
          title: 'New Messages',
          description: 'Get notified when you receive new messages.',
          type: 'switch',
          value: notificationPreferences.new_message,
          disabled: !isSignedIn,
        },
        {
          id: 'session-permissions',
          title: 'Session Permissions',
          description:
            'Get notified when you receive or lose session permissions.',
          type: 'switch',
          value: notificationPreferences.session_permissions,
          disabled: !isSignedIn,
        },
        {
          id: 'agent-permissions',
          title: 'Agent Permissions',
          description:
            'Get notified when you receive or lose agent permissions.',
          type: 'switch',
          value: notificationPreferences.agent_permissions,
          disabled: !isSignedIn,
        },
      ],
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

    const isDisabled = item.disabled || false
    const handleToggle = (value: boolean) => {
      if (isDisabled) return
      const key = NOTIFICATION_KEY_MAP[item.id]
      if (key) {
        updateNotificationPreference(key, value)
      }
    }

    return (
      <View style={[itemStyle, isDisabled && { opacity: 0.5 }]}>
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingTitle,
              isDisabled && { color: colors.textTertiary },
            ]}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.settingDescription,
                isDisabled && { color: colors.textTertiary },
              ]}
            >
              {item.description}
            </Text>
          )}
        </View>
        {!preferencesLoading && (
          <Switch
            value={item.value}
            onValueChange={handleToggle}
            disabled={isDisabled}
          />
        )}
      </View>
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
        ListHeaderComponent={
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        }
      />
    </View>
  )
}
