import SignInModal from '@/components/auth/sign-in-modal'
import { Colors } from '@/constants/theme'
import { config } from '@/lib/config'
import type { BottomTabsParamList } from '@/navigator/bottom-tabs'
import createStyles from '@/styles/webview.styles'
import { isIos } from '@/utils/responsive'
import { useAuth, useClerk } from '@clerk/clerk-expo'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Constants from 'expo-constants'
import * as ImagePicker from 'expo-image-picker'
import * as Network from 'expo-network'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  NativeModules,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
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
  const customWebUrl = process.env.EXPO_PUBLIC_WEB_URL
  if (customWebUrl) return customWebUrl

  const devHost = getDevHost()
  if (devHost) return `http://${devHost}:${WEB_DEV_PORT}`

  if (isIos) return 'http://127.0.0.1:3000'
  return 'http://10.0.2.2:3000'
}

const WEB_URL = getWebUrl()
const WEB_RETURN_PATH = '/'

const buildWebUrl = (path?: string) => {
  if (!path) return WEB_URL
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${WEB_URL}${path}`
  return `${WEB_URL}/${path}`
}

export default function Webview() {
  const { isSignedIn, getToken } = useAuth()
  const route = useRoute<RouteProp<BottomTabsParamList, 'Webview'>>()
  const navigation =
    useNavigation<BottomTabNavigationProp<BottomTabsParamList, 'Webview'>>()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

  const [initialUrl, setInitialUrl] = useState(WEB_URL)
  const [currentUrl, setCurrentUrl] = useState<string>(WEB_URL)
  const [isBridgeLoading, setIsBridgeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | undefined>()

  const webRef = useRef<WebView>(null)
  const hasOpenedSession = useRef(false)
  const lastResetToken = useRef<number | undefined>(undefined)

  // PanResponder for swipe gestures to open/close sidebar
  const panResponder = useMemo(() => {
    const screenWidth = Dimensions.get('window').width
    const EDGE_ZONE_WIDTH = screenWidth * 0.15 // 15% of screen width from left

    return PanResponder.create({
      onStartShouldSetPanResponder: evt => {
        const { pageX } = evt.nativeEvent
        // Start gesture if near left edge (to open) or anywhere when swiping left (potentially to close)
        return pageX < EDGE_ZONE_WIDTH
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX } = evt.nativeEvent
        const screenWidth = Dimensions.get('window').width
        const EDGE_ZONE_WIDTH = screenWidth * 0.15

        const startX = pageX - gestureState.dx
        const startedFromEdge = startX < EDGE_ZONE_WIDTH

        const isHorizontal =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10

        const swipingLeft = gestureState.dx < -10

        // Allow: right swipe from edge to open OR any left swipe (for closing)
        return isHorizontal && (startedFromEdge || swipingLeft)
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const SWIPE_THRESHOLD = 50 // Minimum distance for a swipe
        const VELOCITY_THRESHOLD = 0.5 // Minimum velocity for a swipe

        // Swipe right (open sidebar) - positive dx
        if (
          gestureState.dx > SWIPE_THRESHOLD ||
          gestureState.vx > VELOCITY_THRESHOLD
        ) {
          webRef.current?.injectJavaScript(`
            (function() {
              window.dispatchEvent(new Event('toggle-sidebar'));
              true;
            })();
          `)
        }
        // Swipe left (close sidebar) - negative dx
        else if (
          gestureState.dx < -SWIPE_THRESHOLD ||
          gestureState.vx < -VELOCITY_THRESHOLD
        ) {
          webRef.current?.injectJavaScript(`
            (function() {
              window.dispatchEvent(new CustomEvent('close-sidebar'));
              true;
            })();
          `)
        }
      },
    })
  }, [])

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

  const resetWebview = async () => {
    // Recreate bridge so we don't show stale /settings or stuck pages
    await openWebviewWithSession()
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

  // If a resetToken is passed via navigation params, force a reset
  useEffect(() => {
    const params = route.params as BottomTabsParamList['Webview']
    const token = params?.resetToken
    const targetUrl = params?.targetUrl

    if (token && token !== lastResetToken.current) {
      lastResetToken.current = token
      if (targetUrl) {
        const full = buildWebUrl(targetUrl)
        setInitialUrl(full)
        setCurrentUrl(full)
        webRef.current?.reload()
      } else {
        resetWebview()
      }
      // clear the param so back nav doesn't keep re-triggering
      navigation.setParams({ resetToken: undefined, targetUrl: undefined })
      return
    }

    if (targetUrl && !token) {
      const full = buildWebUrl(targetUrl)
      setInitialUrl(full)
      setCurrentUrl(full)
      webRef.current?.reload()
      navigation.setParams({ targetUrl: undefined })
    }
  }, [route.params, navigation])

  useEffect(() => {
    if (isSignedIn && !hasOpenedSession.current && isConnected !== false) {
      hasOpenedSession.current = true
      openWebviewWithSession()
    } else if (!isSignedIn) {
      hasOpenedSession.current = false
      setInitialUrl(WEB_URL)
    }
  }, [isSignedIn, isConnected])

  const { signOut } = useClerk()

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

      if (msg?.type === 'LOGOUT') {
        await signOut()
        return
      }
    } catch (err) {
      console.error('Failed to handle WebView message', err)
    }
  }

  const openWebviewWithSession = async () => {
    if (!isSignedIn) {
      setShowSignInModal(true)
      return
    }

    setError(null)
    setIsBridgeLoading(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get session token')
      }

      const res = await fetch(
        `${config.API_URL}/v2/auth/native/webview-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.message || 'Failed to create web session'
        throw new Error(msg)
      }

      const data = await res.json()
      const bridgeUrl = `${WEB_URL}/native-bridge?token=${encodeURIComponent(
        data.token,
      )}&return=${encodeURIComponent(WEB_RETURN_PATH)}`

      setInitialUrl(bridgeUrl)
      setCurrentUrl(bridgeUrl)

      if (webRef.current) {
        webRef.current.reload()
      }
    } catch (err: any) {
      console.error('Failed to open webview session', err)
      setError(
        err?.message || 'Something went wrong establishing your web session.',
      )
      hasOpenedSession.current = false
    } finally {
      setIsBridgeLoading(false)
    }
  }

  if (isConnected === null) {
    return (
      <View style={styles.notConnectedContainer}>
        <Text style={styles.notConnectedDescription}>
          Checking connection...
        </Text>
      </View>
    )
  }

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

  return (
    <View style={{ flex: 1 }}>
      {isSignedIn ? (
        <View style={styles.webview}>
          {currentUrl.includes('/settings') && (
            <View style={styles.stickyResetBanner}>
              <Pressable onPress={resetWebview} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset webview</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.webviewContainer} {...panResponder.panHandlers}>
            <WebView
              ref={webRef}
              source={{ uri: initialUrl }}
              onMessage={handleMessage}
              onNavigationStateChange={state => {
                setCurrentUrl(state.url)
              }}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              cacheEnabled={false}
              incognito={false}
            />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.description}>
            You're about to visit the Eden website where you can create and
            share your own artworks.
          </Text>
          {error && <Text style={styles.notConnectedDescription}>{error}</Text>}
          <TouchableOpacity
            onPress={openWebviewWithSession}
            style={styles.button}
            disabled={isBridgeLoading}
          >
            {isBridgeLoading ? (
              <ActivityIndicator color={styles.buttonText.color} />
            ) : (
              <Text style={styles.buttonText}>Enter the Garden</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </View>
  )
}
