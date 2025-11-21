import GoogleAuthButton from './google-auth-button'
import SignInFields from './sign-in-fields'
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
  onSuccess: () => void
}

export default function SignInModal({
  visible,
  onClose,
  onSuccess,
}: SignInModalProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)

  const [error, setError] = useState<string | null>(null)
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  useEffect(() => {
    if (!visible) {
      setError(null)
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
              <Text style={styles.title}>Sign in to Eden.art - App</Text>
              <Text style={styles.subtitle}>
                Welcome back! Please sign in to continue
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.bottomContainer}>
                <View>
                  <SignInFields
                    onSuccess={handleSuccess}
                    onError={handleError}
                    onLoadingChange={setIsEmailLoading}
                  />

                  <GoogleAuthButton
                    onSuccess={handleSuccess}
                    onError={handleError}
                    buttonText="Sign in with Google"
                    disabled={isEmailLoading}
                  />
                </View>
              </View>
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
