import { Colors, Spacing, Typography } from '@/constants/theme'
import { Platform, PlatformColor, StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        Platform.OS === 'ios'
          ? PlatformColor('systemGroupedBackground')
          : Colors[theme].background,
    },
    list: {
      flex: 1,
      paddingTop: 14,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: 32,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 32,
      paddingBottom: 6,
    },
    sectionHeaderText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: Colors[theme].textSecondary,
      textTransform: 'uppercase',
      letterSpacing: -0.08,
    },
    sectionFooter: {
      height: 32,
    },
    settingItem: {
      backgroundColor:
        Platform.OS === 'ios'
          ? PlatformColor('secondarySystemGroupedBackground')
          : Colors[theme].surface,
      paddingHorizontal: 16,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    settingItemIOS: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: PlatformColor('separator'),
    },
    settingItemFirst: {
      ...(Platform.OS === 'ios' && {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      }),
    },
    settingItemLast: {
      ...(Platform.OS === 'ios' && {
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderBottomWidth: 0,
      }),
    },
    settingItemAndroid: {
      backgroundColor: Colors[theme].surface,
      ...(Platform.OS === 'android' && {
        elevation: 0,
      }),
    },
    settingContent: {
      flex: 1,
      marginRight: Spacing.md,
      justifyContent: 'center',
    },
    settingTitle: {
      fontSize:
        Platform.OS === 'ios'
          ? Typography.fontSize.lg
          : Typography.fontSize.base,
      fontFamily:
        Platform.OS === 'ios'
          ? Typography.fontFamily.regular
          : Typography.fontFamily.medium,
      color: Colors[theme].textPrimary,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize:
        Platform.OS === 'ios'
          ? Typography.fontSize.base
          : Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      lineHeight:
        Platform.OS === 'ios'
          ? Typography.fontSize.base * Typography.lineHeight.normal
          : Typography.fontSize.sm * Typography.lineHeight.normal,
      marginTop: 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors[theme].border,
      marginLeft: Platform.OS === 'android' ? Spacing.xl : 0,
    },
  })
