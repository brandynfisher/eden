import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    webview: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    content: {
      flex: 1,
      backgroundColor: Colors[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.xl,
    },
    description: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    button: {
      backgroundColor: Colors[theme].primary,
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
    buttonTextLink: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
      textDecorationLine: 'underline',
      textDecorationColor: Colors[theme].textPrimary,
      textDecorationStyle: 'solid',
    },
    notConnectedContainer: {
      flex: 1,
      backgroundColor: Colors[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.xl,
    },
    notConnectedContent: {
      alignItems: 'center',
      gap: Spacing.lg,
    },
    notConnectedIcon: {
      fontSize: Typography.fontSize['4xl'],
      color: Colors[theme].error,
      marginBottom: Spacing.md,
    },
    notConnectedTitle: {
      fontSize: Typography.fontSize['2xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      textAlign: 'center',
    },
    notConnectedDescription: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
      lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    },
    closeButton: {
      backgroundColor: Colors[theme].primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    closeButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
  })
