import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { config } from '@/lib/config'
import createStyles from '@/styles/delete-account-button.styles'
import { useAuth } from '@clerk/clerk-expo'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function DeleteAccountButton() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'
  const styles = createStyles(theme)
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      console.log(
        '🚀 ~ delete-account-button.tsx:23 ~ handleDeleteAccount ~ token:',
        token,
      )
      if (!token) {
        Alert.alert('Error', 'Authentication required')
        return
      }

      const response = await fetch(
        `${config.API_URL}/v2/user/request-deletion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      )
      console.log(
        '🚀 ~ delete-account-button.tsx:39 ~ handleDeleteAccount ~ response:',
        response,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to submit account deletion request',
        )
      }

      Alert.alert(
        'Request Submitted',
        data.message ||
          'Account deletion request submitted successfully. Our team will process your request shortly.',
        [{ text: 'OK', onPress: () => setShowModal(false) }],
      )
    } catch (error) {
      console.log(
        '🚀 ~ delete-account-button.tsx:54 ~ handleDeleteAccount ~ error:',
        error,
      )
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred'
      Alert.alert('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isLoading && setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete your account? This action will
              submit a request to our support team to permanently delete your
              account and all associated data. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDeleteAccount}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator
                    color={Colors[theme].textInverse}
                    size="small"
                  />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Deletion</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}
