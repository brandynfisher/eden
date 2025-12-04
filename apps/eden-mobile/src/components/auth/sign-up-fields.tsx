import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/sign-up-fields.styles'
import { useSignUp } from '@clerk/clerk-expo'
import { useState } from 'react'
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

type SignUpFieldsProps = {
  onSuccess: () => void
  onError: (error: string) => void
  onVerificationNeeded?: () => void
  onLoadingChange?: (isLoading: boolean) => void
}

export default function SignUpFields({
  onSuccess,
  onError,
  onVerificationNeeded,
  onLoadingChange,
}: SignUpFieldsProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const colors = Colors[theme]
  const styles = createStyles(theme)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const { signUp, setActive, isLoaded } = useSignUp()

  const handleContinue = async () => {
    if (!isLoaded || !username || !email || !password) return

    setIsEmailLoading(true)
    onLoadingChange?.(true)
    onError('')

    try {
      const result = await signUp.create({
        username,
        emailAddress: email,
        password,
        legalAccepted: true,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        onSuccess()
      } else {
        // Email verification required - prepare and send the verification code
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          })
          onVerificationNeeded?.()
        } catch (verifyErr: any) {
          onError(
            verifyErr?.errors?.[0]?.message ||
              'Failed to send verification code. Please try again.',
          )
        }
      }
    } catch (err: any) {
      onError(err?.errors?.[0]?.message || 'Sign up failed')
    } finally {
      setIsEmailLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor={colors.placeholderText}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
          editable={!isEmailLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          placeholderTextColor={colors.placeholderText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isEmailLoading}
        />
      </View>

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
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          activeOpacity={0.7}
        >
          {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.checkboxTextContainer}>
          <Text style={styles.checkboxText}>
            I agree to the <Text style={styles.linkText}>Terms of Service</Text>{' '}
            and <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!username ||
            !email ||
            !password ||
            !agreeToTerms ||
            isEmailLoading) &&
            styles.buttonDisabled,
        ]}
        onPress={handleContinue}
        disabled={
          isEmailLoading || !username || !email || !password || !agreeToTerms
        }
        activeOpacity={0.8}
      >
        {isEmailLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.textInverse} size="small" />
            <Text style={styles.continueLoadingText}>Creating account...</Text>
          </View>
        ) : (
          <View style={styles.continueButtonContent}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>or</Text>
      </View>
    </View>
  )
}
