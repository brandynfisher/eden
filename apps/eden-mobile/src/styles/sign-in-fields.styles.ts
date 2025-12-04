import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { hp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      marginBottom: Spacing.sm,
      color: Colors[theme].textPrimary,
    },
    input: {
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      padding: Spacing.md,
      fontSize: Typography.fontSize.base,
      backgroundColor: Colors[theme].surface,
      borderColor: Colors[theme].border,
      color: Colors[theme].textPrimary,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors[theme].surface,
      borderColor: Colors[theme].border,
    },
    passwordInput: {
      flex: 1,
      padding: Spacing.md,
      fontSize: Typography.fontSize.base,
      color: Colors[theme].textPrimary,
    },
    eyeButton: {
      padding: Spacing.md,
    },
    eyeIcon: {
      fontSize: Typography.fontSize.lg,
    },
    button: {
      borderRadius: BorderRadius.sm,
      padding: Spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      minHeight: hp(6),
      backgroundColor: Colors[theme].button,
    },
    continueButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    continueButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
    continueLoadingText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      marginLeft: Spacing.sm,
      color: Colors[theme].textPrimary,
    },
    arrowIcon: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    dividerText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textTertiary,
    },
  })
