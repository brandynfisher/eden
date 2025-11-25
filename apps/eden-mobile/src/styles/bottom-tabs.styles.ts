import { Colors, Typography } from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    tabBarStyle: {
      backgroundColor: Colors[theme].background,
      borderTopColor: Colors[theme].border,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontFamily: Typography.fontFamily.medium,
    },
    tabBarIcon: {
      // Icon styles are handled by the icon component
    },
  })
