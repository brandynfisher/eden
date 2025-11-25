import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme'
import { wp } from '@/utils/responsive'
import { Dimensions, StyleSheet } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },
    wrapper: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
    skipText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
      color: Colors[theme].textSecondary,
    },
    slideContainer: {
      width: SCREEN_WIDTH,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    slideImage: {
      width: wp(50),
      height: wp(50),
      marginBottom: Spacing['2xl'],
      tintColor: Colors[theme].textPrimary,
    },
    slideTitle: {
      fontSize: Typography.fontSize['3xl'],
      fontFamily: Typography.fontFamily.bold,
      color: Colors[theme].textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    slideDescription: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: Colors[theme].textSecondary,
      textAlign: 'center',
      lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
      maxWidth: '85%',
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    paginationDot: {
      height: 8,
      borderRadius: 4,
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: Colors[theme].primary,
    },
    paginationDotInactive: {
      width: 8,
      backgroundColor: Colors[theme].border,
    },
    footer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    nextButton: {
      backgroundColor: Colors[theme].primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semibold,
      color: Colors[theme].textInverse,
    },
  })
