import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (pressed: boolean): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base];

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        if (pressed) base.push(styles.primaryPressed);
        break;
      case 'secondary':
        base.push(styles.secondary);
        if (pressed) base.push(styles.secondaryPressed);
        break;
      case 'outline':
        base.push(styles.outline);
        if (pressed) base.push(styles.outlinePressed);
        break;
      case 'danger':
        base.push(styles.danger);
        if (pressed) base.push(styles.dangerPressed);
        break;
    }

    if (disabled || loading) {
      base.push(styles.disabled);
    }

    if (style) {
      base.push(style);
    }

    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text];

    switch (variant) {
      case 'primary':
      case 'danger':
        base.push(styles.textLight);
        break;
      case 'secondary':
        base.push(styles.textSecondaryVariant);
        break;
      case 'outline':
        base.push(styles.textOutline);
        break;
    }

    if (disabled) {
      base.push(styles.textDisabled);
    }

    if (textStyle) {
      base.push(textStyle);
    }

    return base;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => getContainerStyle(pressed)}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
    gap: Spacing.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  primaryPressed: {
    backgroundColor: Colors.primaryHover,
    opacity: 0.9,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryPressed: {
    backgroundColor: Colors.surfaceHighlight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  outlinePressed: {
    backgroundColor: Colors.primaryMuted,
  },
  danger: {
    backgroundColor: Colors.critical,
  },
  dangerPressed: {
    backgroundColor: Colors.primaryHover,
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.button,
  },
  textLight: {
    color: Colors.textInverse,
  },
  textSecondaryVariant: {
    color: Colors.text,
  },
  textOutline: {
    color: Colors.primary,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
});
