/**
 * Wellness Theme - Warm Earthy Design
 * Based on Mental-Health-Hub theme with sage green primary colors
 */
import { wp } from '@/utils/responsive'

export const Colors = {
  dark: {
    primary: '#7C3AED',
    background: '#FFFFFF',
    iconPrimary: '#7C3AED',
    iconSecondary: '#1A1A1A',
    button: '#7C3AED',
    placeholderText: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    surface: '#D5D5D5',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowMedium: 'rgba(0, 0, 0, 0.12)',
    shadowStrong: 'rgba(0, 0, 0, 0.2)',
  },
  light: {
    primary: '#7C3AED',
    background: '#1A1A1A',
    iconPrimary: '#8B5CF6',
    iconSecondary: '#FFFFFF',
    button: '#7C3AED',
    placeholderText: '#858585',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textTertiary: '#858585',
    textInverse: '#1A1A1A',
    surface: '#2C2C2C',
    border: '#404040',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
  },
}

// Typography
export const Typography = {
  fontFamily: {
    regular: 'SpaceGrotesk-Regular',
    medium: 'SpaceGrotesk-Medium',
    semibold: 'SpaceGrotesk-SemiBold',
    bold: 'SpaceGrotesk-Bold',
    light: 'SpaceGrotesk-Light',
  },
  fontSize: {
    xs: wp(3),
    sm: wp(3.5),
    base: wp(4),
    lg: wp(4.5),
    xl: wp(5),
    '2xl': wp(6),
    '3xl': wp(7.5),
    '4xl': wp(9),
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// Spacing
export const Spacing = {
  xs: wp(1),
  sm: wp(2),
  md: wp(4),
  lg: wp(6),
  xl: wp(8),
  '2xl': wp(12),
  '3xl': wp(16),
}

// Border Radius (soft curves for wellness design)
export const BorderRadius = {
  sm: wp(2),
  md: wp(4),
  lg: wp(6),
  xl: wp(8),
  full: 9999,
}

// Shadows (for iOS)
export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1, // Android
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
}

// Helper function to get colors based on color scheme
export const useColors = (colorScheme: 'light' | 'dark' = 'light') => {
  return Colors[colorScheme]
}

// Helper function to get shadows based on color scheme
export const useShadows = (colorScheme: 'light' | 'dark' = 'light') => {
  return Shadows[colorScheme]
}
