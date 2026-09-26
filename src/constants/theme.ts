/**
 * RapidRescue Theme Configuration
 *
 * Professional emergency medical design tokens.
 * High-contrast, accessibility-focused palette for high-stress scenarios.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary Emergency
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#FEE2E2',
    primaryGlow: 'rgba(220, 38, 38, 0.15)',

    // Secondary & Accents
    secondary: '#0F172A',
    accent: '#0284C7',
    amber: '#D97706',
    amberLight: '#FEF3C7',
    success: '#059669',
    successLight: '#D1FAE5',

    // Background & Surfaces
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBorder: '#E2E8F0',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',

    // Text
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverted: '#FFFFFF',

    // Status Badges
    statusPending: '#F59E0B',
    statusActive: '#DC2626',
    statusSuccess: '#10B981',
    statusNeutral: '#64748B',
  },
  dark: {
    // Primary Emergency
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#450A0A',
    primaryGlow: 'rgba(239, 68, 68, 0.25)',

    // Secondary & Accents
    secondary: '#F8FAFC',
    accent: '#38BDF8',
    amber: '#F59E0B',
    amberLight: '#451A03',
    success: '#10B981',
    successLight: '#064E3B',

    // Background & Surfaces
    background: '#090D16',
    card: '#121826',
    cardElevated: '#1A2336',
    cardBorder: '#232D42',
    backgroundElement: '#161F30',
    backgroundSelected: '#1E293B',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverted: '#0F172A',

    // Status Badges
    statusPending: '#FBBF24',
    statusActive: '#EF4444',
    statusSuccess: '#34D399',
    statusNeutral: '#94A3B8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ThemeColors = Record<ThemeColor, string>;

export const Typography = {
  family: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'Courier',
    },
    default: {
      regular: 'sans-serif',
      medium: 'sans-serif-medium',
      bold: 'sans-serif',
      mono: 'monospace',
    },
  }),
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5.46,
    elevation: 6,
  },
  emergencyGlow: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
