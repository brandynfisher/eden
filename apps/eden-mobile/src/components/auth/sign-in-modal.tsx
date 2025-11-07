import GoogleAuthButton from './google-auth-button'
import OTPVerification from './otp-verification'
import SignInFields from './sign-in-fields'
import SignUpFields from './sign-up-fields'
import { useColorScheme } from '@/hooks/use-color-scheme'
import createStyles from '@/styles/sign-in-modal.styles'
import { useEffect, useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type SignInModalProps = {
  visible: boolean
  onClose: () => void
}

export default function SignInModal({ visible, onClose }: SignInModalProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const handleSuccess = () => {
    onClose()
    setNeedsVerification(false)
    setMode('signin')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleVerificationNeeded = () => {
    setNeedsVerification(true)
  }

  useEffect(() => {
    if (!visible) {
      setMode('signin')
      setError(null)
      setNeedsVerification(false)
      setIsEmailLoading(false)
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.closeButton} />
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/images/icon.png')}
                  style={styles.logo}
                />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
              {needsVerification ? (
                <>
                  <Text style={styles.title}>Verify your email</Text>
                  <Text style={styles.subtitle}>
                    Enter the verification code sent to your email address
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.title}>
                    {mode === 'signin'
                      ? 'Sign in to Eden.art - App'
                      : 'Create your account'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {mode === 'signin'
                      ? 'Welcome back! Please sign in to continue'
                      : 'Welcome! Please fill in the details to get started.'}
                  </Text>
                </>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              {needsVerification ? (
                <OTPVerification
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <View style={styles.bottomContainer}>
                  <View>
                    {mode === 'signin' ? (
                      <SignInFields
                        onSuccess={handleSuccess}
                        onError={handleError}
                        onLoadingChange={setIsEmailLoading}
                      />
                    ) : (
                      <SignUpFields
                        onSuccess={handleSuccess}
                        onError={handleError}
                        onVerificationNeeded={handleVerificationNeeded}
                        onLoadingChange={setIsEmailLoading}
                      />
                    )}

                    <GoogleAuthButton
                      onSuccess={handleSuccess}
                      onError={handleError}
                      buttonText={
                        mode === 'signin'
                          ? 'Sign in with Google'
                          : 'Sign up with Google'
                      }
                      disabled={isEmailLoading}
                    />
                  </View>

                  <View style={styles.switchModeContainer}>
                    <Text style={styles.switchModeText}>
                      {mode === 'signin'
                        ? "Don't have an account? "
                        : 'Already have an account? '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin')
                        setError(null)
                      }}
                    >
                      <Text style={styles.switchModeLink}>
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Text style={styles.footerText}>Secured by </Text>
                <Text style={styles.clerkText}>CLERK</Text>
              </View>
              <View style={styles.footerRight}>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Help</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}> • </Text>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Privacy</Text>
                </TouchableOpacity>
                <Text style={styles.footerSeparator}> • </Text>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Terms</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
