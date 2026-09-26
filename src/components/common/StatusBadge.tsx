/**
 * RapidRescue Status Badge
 *
 * Micro-component for displaying environment tags, readiness status,
 * and emergency indicators with matching tint colors.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type StatusVariant = 'emergency' | 'warning' | 'success' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
}) => {
  const { colors, borderRadius } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'emergency':
        return {
          bg: colors.primaryLight,
          text: colors.primary,
          border: colors.primary,
        };
      case 'warning':
        return {
          bg: colors.amberLight,
          text: colors.amber,
          border: colors.amber,
        };
      case 'success':
        return {
          bg: colors.successLight,
          text: colors.success,
          border: colors.success,
        };
      case 'info':
        return {
          bg: 'rgba(2, 132, 199, 0.15)',
          text: colors.accent,
          border: colors.accent,
        };
      case 'neutral':
      default:
        return {
          bg: colors.backgroundElement,
          text: colors.textSecondary,
          border: colors.cardBorder,
        };
    }
  };

  const current = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          borderRadius: borderRadius.full,
        },
      ]}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.label, { color: current.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default StatusBadge;
