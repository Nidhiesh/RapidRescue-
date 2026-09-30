import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, elevated = false }) => {
  return (
    <View
      style={[
        styles.card,
        elevated ? styles.elevated : styles.standard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  standard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
