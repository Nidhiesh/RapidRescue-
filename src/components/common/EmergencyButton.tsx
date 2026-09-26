/**
 * RapidRescue Emergency Button
 *
 * High-visibility action button designed for accessibility
 * and rapid response during high-stress scenarios.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface EmergencyButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, borderRadius, typography } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.primary,
          text: '#FFFFFF',
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: '#DC2626',
          text: '#FFFFFF',
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: colors.backgroundElement,
          text: colors.text,
          border: colors.cardBorder,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.text,
          border: colors.cardBorder,
        };
    }
  };

  const current = getVariantStyles();
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          borderRadius: borderRadius.md,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={current.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: current.text,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default EmergencyButton;
