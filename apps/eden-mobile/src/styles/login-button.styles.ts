import { BorderRadius, Colors, Typography } from '@/constants/theme'
import { hp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    loginButton: {
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors[theme].button,
      width: '80%',
      height: hp(5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textInverse,
    },
  })
