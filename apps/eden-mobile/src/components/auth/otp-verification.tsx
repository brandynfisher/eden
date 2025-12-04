import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/otp-verification.styles'
import { useSignUp } from '@clerk/clerk-expo'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { CodeField, Cursor } from 'react-native-confirmation-code-field'

type OTPVerificationProps = {
  onSuccess: () => void
  onError: (error: string) => void
}

export default function OTPVerification({
  onSuccess,
  onError,
}: OTPVerificationProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isPreparing, setIsPreparing] = useState(false)
  const { signUp, setActive, isLoaded } = useSignUp()

  // Ensure verification is prepared when component mounts (only if not already prepared)
  useEffect(() => {
    const prepareVerification = async () => {
      if (!isLoaded || !signUp || !signUp.emailAddress) return

      const emailVerification = signUp.verifications?.emailAddress

      // If already verified, don't do anything
      if (emailVerification?.status === 'verified') {
        return
      }

      // Check if verification has already been prepared (code sent)
      // If nextAction exists or expireAt exists, a code has already been sent
      const hasCodeBeenSent =
        emailVerification?.nextAction ||
        emailVerification?.expireAt ||
        emailVerification?.status === 'transferable'

      // Only prepare if verification doesn't exist or no code has been sent
      if (
        !emailVerification ||
        (!hasCodeBeenSent && emailVerification.status === 'unverified')
      ) {
        setIsPreparing(true)
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          })
        } catch (err: any) {
          onError(
            err?.errors?.[0]?.message ||
              'Failed to prepare verification. Please try again.',
          )
        } finally {
          setIsPreparing(false)
        }
      }
    }

    prepareVerification()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, signUp?.id])

  const handleCodeVerification = async () => {
    if (!isLoaded || !signUp || !code || code.length !== 6) return

    // Trim and ensure code is exactly 6 digits
    const trimmedCode = code.trim().replace(/\s/g, '')
    if (trimmedCode.length !== 6) return

    setIsVerifying(true)
    onError('')

    try {
      // Check if signUp is ready for verification
      if (!signUp.id) {
        onError('Session expired. Please try signing up again.')
        setIsVerifying(false)
        return
      }

      // Check if verification exists
      const emailVerification = signUp.verifications?.emailAddress
      if (!emailVerification) {
        onError(
          'Verification not initialized. Please wait a moment and try again.',
        )
        setIsVerifying(false)
        return
      }

      const result = await signUp.attemptEmailAddressVerification({
        code: trimmedCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        onSuccess()
      } else {
        onError('Verification incomplete. Please check your code.')
      }
    } catch (err: any) {
      const errorCode = err?.errors?.[0]?.code
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'Code verification failed'

      // For incorrect code errors, suggest resending
      if (errorCode === 'form_code_incorrect') {
        const message = `${errorMessage}. The code may have expired. Please try resending.`
        onError(message)
        // Don't clear code - let user see what they entered
      } else if (
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('session')
      ) {
        setCode('')
        onError(errorMessage)
      } else {
        onError(errorMessage)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !isVerifying && isLoaded) {
      handleCodeVerification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isLoaded])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = async () => {
    if (!isLoaded || isResending || resendCooldown > 0) return

    setIsResending(true)
    onError('')

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      })
      setResendCooldown(60) // 60 second cooldown
    } catch (err: any) {
      onError(err?.errors?.[0]?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.codeFieldWrapper}>
        <CodeField
          value={code}
          onChangeText={text => {
            // Only allow digits
            const digitsOnly = text.replace(/[^0-9]/g, '')
            if (digitsOnly.length <= 6) {
              setCode(digitsOnly)
            }
          }}
          cellCount={6}
          rootStyle={styles.codeFieldRoot}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          editable={!isVerifying && !isPreparing}
          renderCell={({ index, symbol, isFocused }) => (
            <View
              key={index}
              style={[
                styles.codeCell,
                isFocused && styles.codeCellFocused,
                symbol && styles.codeCellFilled,
              ]}
            >
              <Text style={styles.codeCellText}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            </View>
          )}
        />
      </View>
      {(isVerifying || isPreparing) && (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator color={Colors[theme].textSecondary} size="small" />
          <Text style={styles.verifyingText}>
            {isPreparing ? 'Preparing verification...' : 'Verifying code...'}
          </Text>
        </View>
      )}

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={isResending || resendCooldown > 0}
          activeOpacity={0.7}
        >
          {isResending ? (
            <View style={styles.resendButtonContent}>
              <ActivityIndicator color={Colors[theme].primary} size="small" />
              <Text style={styles.resendButtonText}>Sending...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.resendButtonText,
                (isResending || resendCooldown > 0) &&
                  styles.resendButtonDisabled,
              ]}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
