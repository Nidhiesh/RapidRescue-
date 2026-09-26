/**
 * RapidRescue useTheme Hook
 *
 * Provides active color tokens and theme helpers based on user color scheme.
 */

import { useColorScheme } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows, ThemeColors } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const colors: ThemeColors = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    colorScheme,
    colors,
    spacing: Spacing,
    typography: Typography,
    borderRadius: BorderRadius,
    shadows: Shadows,
  };
}

export default useTheme;
