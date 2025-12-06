import { useEffect, useState } from 'react'

/**
 * Detects whether the web app is running inside the React Native WebView
 * that the Eden mobile app uses. `window.ReactNativeWebView` is injected
 * by `react-native-webview`, so this returns `true` only inside the app.
 */
export function useNativeWebview(): boolean {
  const [isNativeWebview, setIsNativeWebview] = useState(false)

  useEffect(() => {
    const isNative =
      typeof window !== 'undefined' &&
      typeof (window as unknown as { ReactNativeWebView?: unknown })
        .ReactNativeWebView !== 'undefined'

    setIsNativeWebview(isNative)
  }, [])

  return isNativeWebview
}
