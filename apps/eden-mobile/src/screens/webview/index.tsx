import LogoutButton from '@/components/auth/logout-button'
import { useAuth } from '@clerk/clerk-expo'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { WebView } from 'react-native-webview'

const WEB_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://app.eden.art'

export default function Webview() {
  const { isSignedIn, getToken, signOut } = useAuth()
  const [webUrl, setWebUrl] = useState<string | null>(null)
  const webRef = useRef<WebView>(null)

  // Generate Clerk token and append to URL
  useEffect(() => {
    const loadWeb = async () => {
      if (!isSignedIn) {
        setWebUrl(null)
        return
      }
      try {
        const token = await getToken()
        if (!token) return
        setWebUrl(`${WEB_URL}?__clerk_token=${encodeURIComponent(token)}`)
      } catch (error) {
        console.error('Error generating Clerk token:', error)
      }
    }
    loadWeb()
  }, [isSignedIn])

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      console.log('📱 Message from WebView:', msg)
      if (msg.type === 'logout') signOut()
    } catch (err) {}
  }

  if (!webUrl) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {isSignedIn && <LogoutButton />}
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      {isSignedIn && <LogoutButton />}
      <WebView
        ref={webRef}
        source={{ uri: webUrl }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled={false}
        incognito={false}
        onLoadEnd={() => {
          webRef.current?.injectJavaScript(`
            if (window.Clerk && window.handleMobileAuthToken) {
              window.handleMobileAuthToken(${JSON.stringify(
                webUrl.split('?__clerk_token=')[1],
              )});
            }
            true;
          `)
        }}
      />
    </View>
  )
}
