import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { StatusVariant } from '../../types';

interface BadgeProps {
  label: string;
  variant?: StatusVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: Colors.successMuted, borderColor: Colors.success },
          text: { color: Colors.success },
        };
      case 'warning':
        return {
          container: { backgroundColor: Colors.warningMuted, borderColor: Colors.warning },
          text: { color: Colors.warning },
        };
      case 'error':
        return {
          container: { backgroundColor: Colors.errorMuted, borderColor: Colors.error },
          text: { color: Colors.error },
        };
      case 'critical':
        return {
          container: { backgroundColor: Colors.criticalMuted, borderColor: Colors.critical },
          text: { color: Colors.critical },
        };
      case 'info':
        return {
          container: { backgroundColor: Colors.secondaryMuted, borderColor: Colors.secondary },
          text: { color: Colors.secondary },
        };
      default:
        return {
          container: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.borderLight },
          text: { color: Colors.textSecondary },
        };
    }
  };

  const currentStyle = getBadgeStyle();

  return (
    <View style={[styles.badge, currentStyle.container, style]}>
      <Text style={[styles.text, currentStyle.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.badge,
  },
});
