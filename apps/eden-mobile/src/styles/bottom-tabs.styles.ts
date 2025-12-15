import { Colors, Typography } from '@/constants/theme'
import { hp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark', bottomInset: number = 0) =>
  StyleSheet.create({
    tabBarStyle: {
      backgroundColor: Colors[theme].background,
      borderTopColor: Colors[theme].border,
      borderTopWidth: 1,
      paddingTop: hp(1.5),
      paddingBottom: Math.max(bottomInset, hp(2)),
      height: hp(6) + Math.max(bottomInset, hp(2)),
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontFamily: Typography.fontFamily.medium,
    },
    tabBarIcon: {
      // Icon styles are handled by the icon component
    },
  })
