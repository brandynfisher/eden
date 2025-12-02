import createStyles from '@/styles/webview.styles'
import { isIos } from '@/utils/responsive'
import Constants from 'expo-constants'
import * as ImagePicker from 'expo-image-picker'
import * as Network from 'expo-network'
import { useEffect, useRef, useState } from 'react'
import {
  AppState,
  NativeModules,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

const WEB_DEV_PORT = 3000

/**
 * In Expo dev, the JS bundle is served from the host running Metro.
 * We can reuse that host for the web app instead of hard-coding localhost.
 */
const getDevHost = () => {
  const hostFromExpo =
    Constants.expoConfig?.hostUri?.split(':')?.[0] ??
    // SDK 49+ manifest shape
    Constants.manifest2?.extra?.expoGo?.debuggerHost?.split(':')?.[0] ??
    // Older manifest shape
    Constants.manifest?.debuggerHost?.split(':')?.[0]

  if (hostFromExpo) return hostFromExpo

  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined
  if (scriptURL) {
    const host = scriptURL.split('://')[1]?.split(':')?.[0]
    if (host) return host
  }

  return null
}

const getWebUrl = () => {
  if (!__DEV__) return 'https://app.eden.art'

  const devHost = getDevHost()

  // Fallbacks by platform
  if (devHost) return `http://${devHost}:${WEB_DEV_PORT}`

  if (isIos) return 'http://127.0.0.1:3000'

  // Android emulator default
  return 'http://10.0.2.2:3000'
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
            <Text style={styles.buttonText}>Enter the Garden</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
