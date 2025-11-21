import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/sign-in-fields.styles'
import { useSignIn } from '@clerk/clerk-expo'
import { useState } from 'react'
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

type SignInFieldsProps = {
  onSuccess: () => void
  onError: (error: string) => void
  onLoadingChange?: (isLoading: boolean) => void
}

export default function SignInFields({
  onSuccess,
  onError,
  onLoadingChange,
}: SignInFieldsProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const colors = Colors[theme]
  const styles = createStyles(theme)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(false)

  const { signIn, setActive, isLoaded } = useSignIn()

  const handleContinue = async () => {
    if (!isLoaded || !identifier) return

    setIsEmailLoading(true)
    onLoadingChange?.(true)
    onError('')

    try {
      const result = await signIn.create({
        identifier,
      })

      if (result.supportedFirstFactors) {
        const passwordFactor = result.supportedFirstFactors.find(
          (factor: any) => factor.strategy === 'password',
        )
        if (passwordFactor) {
          setNeedsPassword(true)
        }
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || 'Sign in failed'
      onError(errorMessage)
      if (errorMessage.toLowerCase().includes('password')) {
        setNeedsPassword(true)
      }
    } finally {
      setIsEmailLoading(false)
      onLoadingChange?.(false)
    }
  }

  const handleEmailPasswordSignIn = async () => {
    if (!isLoaded || !identifier || !password) return

    setIsEmailLoading(true)
    onLoadingChange?.(true)
    onError('')

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        onSuccess()
      } else {
        onError('Sign in incomplete. Please check your email.')
      }
    } catch (err: any) {
      onError(err?.errors?.[0]?.message || 'Sign in failed')
    } finally {
      setIsEmailLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email address or username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email or username"
          placeholderTextColor={colors.placeholderText}
          value={identifier}
          onChangeText={setIdentifier}
          onChange={() => {
            setNeedsPassword(false)
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isEmailLoading}
          onSubmitEditing={handleContinue}
        />
      </View>

      {needsPassword && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isEmailLoading}
              onSubmitEditing={handleEmailPasswordSignIn}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!needsPassword ? (
        <TouchableOpacity
          style={[
            styles.button,
            (!identifier || isEmailLoading) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isEmailLoading || !identifier}
          activeOpacity={0.8}
        >
          {isEmailLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.continueLoadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.continueButtonContent}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : needsPassword ? (
        <TouchableOpacity
          style={[
            styles.button,
            (!identifier || !password || isEmailLoading) &&
              styles.buttonDisabled,
          ]}
          onPress={handleEmailPasswordSignIn}
          disabled={isEmailLoading || !identifier || !password}
          activeOpacity={0.8}
        >
          {isEmailLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.continueLoadingText}>Signing in...</Text>
            </View>
          ) : (
            <View style={styles.continueButtonContent}>
              <Text style={styles.continueButtonText}>Sign In</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : null}

      <View style={styles.divider}>
        <Text style={styles.dividerText}>or</Text>
      </View>
    </View>
  )
}
