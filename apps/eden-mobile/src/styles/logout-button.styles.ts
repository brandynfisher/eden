import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    logoutButton: {
      backgroundColor: Colors[theme].error,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    logoutButtonText: {
      color: Colors[theme].textInverse,
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
    },
  })
