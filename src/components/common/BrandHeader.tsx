/**
 * RapidRescue Brand Header
 *
 * Prominent branding displaying the RapidRescue emergency insignia,
 * title, and emergency dispatch tagline.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface BrandHeaderProps {
  subtitle?: string;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  subtitle = 'Emergency Medical Response Network',
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View style={styles.container}>
      {/* Emergency Badge Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.xl,
          },
        ]}
      >
        <Ionicons name="medical" size={32} color="#FFFFFF" />
      </View>

      {/* Brand Title */}
      <View style={styles.titleRow}>
        <Text style={[styles.titleMain, { color: colors.text }]}>Rapid</Text>
        <Text style={[styles.titleAccent, { color: colors.primary }]}>Rescue</Text>
      </View>

      {/* Tagline */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleMain: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

export default BrandHeader;
