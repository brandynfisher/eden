import createStyles from '@/styles/webview.styles'
import { isIos } from '@/utils/responsive'
import * as ImagePicker from 'expo-image-picker'
import * as Network from 'expo-network'
import { useEffect, useRef, useState } from 'react'
import {
  AppState,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

// For Android real device testing, set this to your computer's local IP address
// Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1
// Make sure your Android device is on the same WiFi network
const ANDROID_LOCAL_IP = '192.168.110.223' // Change this to your local IP

const getWebUrl = () => {
  if (!__DEV__) {
    return 'https://app.eden.art'
  }

  if (isIos) {
    // iOS can use localhost when connected via USB
    return 'http://localhost:3000'
  } else {
    // Android: Use local IP for real device, or 10.0.2.2 for emulator
    // If ANDROID_LOCAL_IP is set, use it; otherwise default to emulator address
    return ANDROID_LOCAL_IP
      ? `http://${ANDROID_LOCAL_IP}:3000`
      : 'http://10.0.2.2:3000'
  }
}

const WEB_URL = getWebUrl()

export default function Webview() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const insets = useSafeAreaInsets()

  const [loadWebview, setLoadWebview] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | undefined>()

  const webRef = useRef<WebView>(null)

  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      setIsConnected(
        networkState.isConnected && networkState.isInternetReachable,
      )
    } catch (error) {
      console.error('Error checking network status:', error)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    checkNetworkStatus()

    // Poll network status every 3 seconds
    const interval = setInterval(() => {
      checkNetworkStatus()
    }, 3000)

    // Check network status when app comes to foreground (e.g., after returning from settings)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkNetworkStatus()
      }
    })

    return () => {
      clearInterval(interval)
      subscription.remove()
    }
  }, [])

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)

      if (msg?.type === 'CHECK_NATIVE_PERMISSIONS') {
        const [cameraStatus, mediaStatus] = await Promise.all([
          ImagePicker.getCameraPermissionsAsync(),
          ImagePicker.getMediaLibraryPermissionsAsync(),
        ])

        const response = {
          type: 'PERMISSIONS_RESULT',
          cameraGranted: cameraStatus.status === 'granted',
          storageGranted: mediaStatus.status === 'granted',
        }

        webRef.current?.postMessage(JSON.stringify(response))
        return
      }

      console.log('📱 Message from WebView:', msg)
    } catch (err) {
      console.error('Failed to handle WebView message', err)
    }
  }

  // Show loading state while checking network
  if (isConnected === null) {
    return (
      <View style={styles.notConnectedContainer}>
        <Text style={styles.notConnectedDescription}>
          Checking connection...
        </Text>
      </View>
    )
  }

  // Show not connected screen if no network
  if (!isConnected) {
    return (
      <View style={styles.notConnectedContainer}>
        <View style={styles.notConnectedContent}>
          <Text style={styles.notConnectedIcon}>📡</Text>
          <Text style={styles.notConnectedTitle}>No Internet Connection</Text>
          <Text style={styles.notConnectedDescription}>
            Please check your internet connection and try again. You need an
            active connection to access the Eden website.
          </Text>
        </View>
      </View>
    )
  }

  // Show webview or button to enter webview when connected
  return (
    <View style={{ flex: 1 }}>
      {loadWebview ? (
        <View style={styles.webview}>
          <TouchableOpacity
            onPress={() => setLoadWebview(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close Webview</Text>
          </TouchableOpacity>
          <WebView
            ref={webRef}
            source={{ uri: `${WEB_URL}/sign-in` }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            cacheEnabled={false}
            incognito={false}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.description}>
            You're about to visit the Eden website where you can log in to your
            account and access all features.
          </Text>
          <TouchableOpacity
            onPress={() => setLoadWebview(true)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              Go to{' '}
              <Text style={styles.buttonTextLink}>https://app.eden.art</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
