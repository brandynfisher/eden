import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark', bottomInset: number = 0) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg + bottomInset,
    },
    content: {
      alignItems: 'center',
      gap: Spacing.xl,
    },
    logo: {
      width: wp(40),
      height: wp(40),
      tintColor: Colors[theme].textPrimary,
    },
    title: {
      fontSize: Typography.fontSize['4xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
      maxWidth: '90%',
    },
    description: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textTertiary,
      textAlign: 'center',
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
      maxWidth: '85%',
    },
    button: {
      backgroundColor: Colors[theme].primary,
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing['3xl'],
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textInverse,
    },
  })
