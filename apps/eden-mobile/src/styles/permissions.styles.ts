import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
    },
    header: {
      marginBottom: Spacing['2xl'],
    },
    title: {
      fontSize: Typography.fontSize['3xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    },
    permissionsList: {
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    permissionItem: {
      backgroundColor: Colors[theme].surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    permissionIcon: {
      fontSize: 32,
    },
    permissionContent: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
      marginBottom: Spacing.xs,
    },
    permissionDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    },
    footer: {
      marginTop: 'auto',
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
    },
    continueButton: {
      backgroundColor: Colors[theme].primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    continueButtonDisabled: {
      opacity: 0.7,
    },
    continueButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
    footerText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textTertiary,
      textAlign: 'center',
      lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
    },
  })
