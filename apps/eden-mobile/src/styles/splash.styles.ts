import { Colors, Spacing, Typography } from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    logo: {
      width: wp(50),
      height: wp(50),
      tintColor: Colors[theme].iconSecondary,
    },
    title: {
      fontSize: Typography.fontSize['4xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.normal,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      width: '80%',
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    },
    link: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].primary,
      textDecorationLine: 'underline',
      textDecorationColor: Colors[theme].primary,
      textDecorationStyle: 'solid',
      lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    },
    footerSeparator: {
      width: '80%',
      height: 1,
      marginVertical: Spacing.lg,
      backgroundColor: Colors[theme].border,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
  })
