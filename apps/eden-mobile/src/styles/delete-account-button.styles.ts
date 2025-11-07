import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    deleteButton: {
      backgroundColor: Colors[theme].error,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    deleteButtonText: {
      color: Colors[theme].textInverse,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      backgroundColor: Colors[theme].background,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      width: '100%',
      maxWidth: wp(100),
      ...Shadows[theme].xl,
    },
    modalTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      marginBottom: Spacing.md,
    },
    modalDescription: {
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].textSecondary,
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
      marginBottom: Spacing.lg,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      justifyContent: 'flex-end',
    },
    modalButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.sm,
      minWidth: wp(25),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: Colors[theme].surface,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },
    cancelButtonText: {
      color: Colors[theme].textPrimary,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
    },
    confirmButton: {
      backgroundColor: Colors[theme].error,
    },
    confirmButtonText: {
      color: Colors[theme].textInverse,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
    },
  })
