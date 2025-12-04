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
      paddingTop: Platform.OS === 'ios' ? 14 : Spacing.xl,
    },
    listContent: {
      paddingTop: Platform.OS === 'ios' ? 8 : Spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
      paddingHorizontal: Platform.OS === 'ios' ? 16 : 0,
    },
    sectionHeader: {
      paddingHorizontal: Platform.OS === 'ios' ? 16 : Spacing.xl,
      paddingTop: Platform.OS === 'ios' ? 32 : Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 6 : Spacing.xs,
    },
    sectionHeaderText: {
      fontSize:
        Platform.OS === 'ios' ? Typography.fontSize.sm : Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: Colors[theme].textSecondary,
      textTransform: 'uppercase',
      letterSpacing: Platform.OS === 'ios' ? -0.08 : 0.5,
    },
    sectionFooter: {
      height: Platform.OS === 'ios' ? 32 : 0,
    },
    settingItem: {
      backgroundColor:
        Platform.OS === 'ios'
          ? PlatformColor('secondarySystemGroupedBackground')
          : Colors[theme].surface,
      paddingHorizontal: Platform.OS === 'ios' ? 16 : Spacing.xl,
      paddingVertical: Platform.OS === 'ios' ? 11 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: Platform.OS === 'ios' ? 44 : 48,
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
      marginBottom: Platform.OS === 'ios' ? 2 : Spacing.xs,
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
      marginTop: Platform.OS === 'ios' ? 2 : 0,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors[theme].border,
      marginLeft: Platform.OS === 'android' ? Spacing.xl : 0,
    },
  })
