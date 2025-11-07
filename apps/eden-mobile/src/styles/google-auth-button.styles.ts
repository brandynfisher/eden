import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { hp, wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    button: {
      borderRadius: BorderRadius.sm,
      padding: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      minHeight: hp(6),
    },
    googleButton: {
      backgroundColor: Colors[theme].surface,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },
    googleButtonText: {
      color: Colors[theme].textPrimary,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
    },
    googleLoadingText: {
      color: Colors[theme].textPrimary,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
      marginLeft: Spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    googleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    googleLogo: {
      width: wp(5),
      height: wp(5),
    },
  })
