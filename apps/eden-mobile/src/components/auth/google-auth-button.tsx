import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/google-auth-button.styles'
import { useSSO } from '@clerk/clerk-expo'
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type GoogleAuthButtonProps = {
  onSuccess: () => void
  onError: (error: string) => void
  buttonText: string
  disabled?: boolean
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  buttonText,
  disabled = false,
}: GoogleAuthButtonProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const [isLoading, setIsLoading] = useState(false)
  const { startSSOFlow } = useSSO()

  const handleGoogleAuth = async () => {
    if (disabled || isLoading) return

    setIsLoading(true)
    onError('')

    try {
      const result = await startSSOFlow({
        // Deep link scheme: edenmobile://oauth/callback
        // This must match what's configured in Clerk Dashboard → Google OAuth → Redirect URLs
        redirectUrl: 'edenmobile://oauth/callback',
        strategy: 'oauth_google',
      })

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId })
      }

      onSuccess()
    } catch (err: any) {
      if (err?.errors?.[0]?.code === 'user_cancelled') {
        return
      }

      const errorMessage =
        err?.errors?.[0]?.message || 'Google authentication failed'

      if (
        errorMessage.toLowerCase().includes('already connected') ||
        errorMessage.toLowerCase().includes('already linked') ||
        errorMessage.toLowerCase().includes('duplicate')
      ) {
        onError('This Google account is already connected to another account')
      } else {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.googleButton,
        (disabled || isLoading) && styles.buttonDisabled,
      ]}
      onPress={handleGoogleAuth}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#4285f4" size="small" />
          <Text style={styles.googleLoadingText}>Connecting...</Text>
        </View>
      ) : (
        <View style={styles.googleButtonContent}>
          <Image
            source={{
              uri: 'https://google.com/favicon.ico',
            }}
            style={styles.googleLogo}
            resizeMode="contain"
          />
          <Text style={styles.googleButtonText}>{buttonText}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
