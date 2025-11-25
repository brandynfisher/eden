import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.fontSize['3xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      marginBottom: Spacing.md,
    },
    settingItem: {
      backgroundColor: Colors[theme].surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingContent: {
      flex: 1,
      marginRight: Spacing.md,
    },
    settingTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textPrimary,
      marginBottom: Spacing.xs,
    },
    settingDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    },
  })
