import { config } from '@/lib/config'
import { useAuth } from '@clerk/clerk-expo'
import * as Notifications from 'expo-notifications'
import type { EventSubscription } from 'expo-notifications'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications() {
  const { userId, getToken } = useAuth()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null)
  const notificationListener = useRef<EventSubscription | null>(null)
  const responseListener = useRef<EventSubscription | null>(null)

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token)
      if (token && userId && getToken) {
        // Send token to your API
        registerPushToken(token, getToken)
      }
    })

    // Listener for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification)
      })

    // Listener for when user taps on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data
        console.log('Notification tapped:', data)
        // Handle navigation based on notification data
        // e.g., navigate to a specific screen
      })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [userId, getToken])

  // Re-register token when user changes
  useEffect(() => {
    if (expoPushToken && userId && getToken) {
      registerPushToken(expoPushToken, getToken)
    }
  }, [userId, expoPushToken, getToken])

  return {
    expoPushToken,
    notification,
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!')
    return null
  }

  try {
    // Try to get project ID from environment variable first
    let projectId = process.env.EXPO_PUBLIC_PROJECT_ID

    // Fallback to app.json if env var is not set
    if (!projectId) {
      try {
        const expoConfig = require('../../app.json')
        projectId = expoConfig?.expo?.extra?.eas?.projectId
      } catch (error) {
        // Ignore if app.json can't be read
      }
    }

    // Project ID is optional - Expo will try to auto-detect it
    // For production push notifications, you'll need to set it
    const tokenOptions: { projectId?: string } = {}
    if (projectId) {
      tokenOptions.projectId = projectId
    } else {
      console.warn(
        'EXPO_PUBLIC_PROJECT_ID is not set and projectId not found in app.json. ' +
          'Push notifications may not work in production. ' +
          'Ask your client for the Expo project ID or Expo account access.',
      )
    }

    token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data

    console.log('Expo Push Token:', token)
  } catch (error) {
    console.error('Error getting push token:', error)
    // If project ID is required but missing, this will fail
    // The error message will indicate what's needed
  }

  return token
}

async function registerPushToken(
  token: string,
  getToken: () => Promise<string | null>,
) {
  try {
    // Get auth token from Clerk
    const authToken = await getToken()

    if (!authToken) {
      console.warn('No auth token available, skipping push token registration')
      return
    }

    const response = await fetch(
      `${config.API_URL}/v2/notifications/register-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          push_token: token,
          platform: Platform.OS,
        }),
      },
    )

    if (!response.ok) {
      console.error('Failed to register push token:', await response.text())
    } else {
      console.log('Push token registered successfully')
    }
  } catch (error) {
    console.error('Error registering push token:', error)
  }
}
