import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    loginButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors[theme].button,
    },
    loginButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textInverse,
    },
  })
