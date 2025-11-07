import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    authButtons: {
      gap: Spacing.md,
      justifyContent: 'center',
    },
    title: {
      marginBottom: Spacing.sm,
      textAlign: 'center',
      color: Colors[theme].textPrimary,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      textAlign: 'center',
      lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
      color: Colors[theme].textSecondary,
    },
    loader: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    loaderText: {
      marginTop: Spacing.sm,
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].textSecondary,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    errorTitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      textAlign: 'center',
      color: Colors[theme].error,
    },
    errorBody: {
      fontSize: Typography.fontSize.sm,
      textAlign: 'center',
      color: Colors[theme].textPrimary,
    },
    errorHint: {
      fontSize: Typography.fontSize.xs,
      textAlign: 'center',
      color: Colors[theme].textTertiary,
    },
    listContent: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    list: {
      flex: 1,
    },
    agentItem: {
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      backgroundColor: Colors[theme].surface,
      ...Shadows[theme].md,
    },
    agentName: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      marginBottom: Spacing.xs,
      color: Colors[theme].textPrimary,
    },
    agentMeta: {
      fontSize: Typography.fontSize.xs,
      marginBottom: Spacing.sm,
      color: Colors[theme].primary,
    },
    agentDescription: {
      fontSize: Typography.fontSize.xs,
      lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
      color: Colors[theme].textPrimary,
    },
    agentDescriptionMuted: {
      fontSize: Typography.fontSize.xs,
      color: Colors[theme].textTertiary,
    },
    emptyState: {
      fontSize: Typography.fontSize.sm,
      textAlign: 'center',
      marginTop: Spacing.lg,
      color: Colors[theme].textTertiary,
    },
  })
