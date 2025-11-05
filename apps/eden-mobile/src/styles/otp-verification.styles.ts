import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { StyleSheet } from 'react-native'

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Spacing.lg,
    },
    codeFieldWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeFieldRoot: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    codeCell: {
      width: wp(13),
      height: wp(13),
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows[theme].sm,
    },
    codeCellFocused: {
      borderColor: Colors[theme].primary,
      backgroundColor: Colors[theme].background,
      borderWidth: 2.5,
      ...Shadows[theme].sm,
    },
    codeCellFilled: {
      borderColor: Colors[theme].primary,
      backgroundColor: Colors[theme].background,
      borderWidth: 2.5,
    },
    codeCellText: {
      fontSize: Typography.fontSize['2xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      textAlign: 'center',
      lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
      letterSpacing: 0.5,
    },
    verifyingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.xl,
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
    },
    verifyingText: {
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].textSecondary,
      fontFamily: Typography.fontFamily.medium,
      letterSpacing: 0.3,
    },
    resendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.lg,
      gap: Spacing.xs,
    },
    resendText: {
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].textTertiary,
    },
    resendButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    resendButtonText: {
      fontSize: Typography.fontSize.sm,
      color: Colors[theme].primary,
      fontFamily: Typography.fontFamily.semibold,
      textDecorationLine: 'underline',
    },
    resendButtonDisabled: {
      color: Colors[theme].textTertiary,
      opacity: 0.6,
    },
  })
