import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing.lg,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    logoContainer: {
      flex: 1,
      alignItems: 'center',
    },
    logo: {
      width: wp(12),
      height: wp(12),
      alignItems: 'center',
      justifyContent: 'center',
      tintColor: Colors[theme].iconSecondary,
    },
    closeButton: {
      width: wp(8),
      height: wp(8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textPrimary,
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.fontSize['2xl'],
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.sm,
      textAlign: 'center',
      color: Colors[theme].textPrimary,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      color: Colors[theme].textSecondary,
    },
    errorContainer: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      backgroundColor: Colors[theme].error + '20',
    },
    errorText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: Colors[theme].error,
      textAlign: 'center',
    },
    form: {
      flex: 1,
    },
    switchModeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    switchModeText: {
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].textPrimary,
    },
    switchModeLink: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      textDecorationLine: 'underline',
      color: Colors[theme].primary,
    },
    bottomContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xl,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: Colors[theme].border,
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerText: {
      fontSize: Typography.fontSize.xs,
      color: Colors[theme].textTertiary,
    },
    clerkText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerLink: {
      fontSize: Typography.fontSize.xs,
      color: Colors[theme].textTertiary,
    },
    footerSeparator: {
      fontSize: Typography.fontSize.xs,
      color: Colors[theme].border,
    },
  })
