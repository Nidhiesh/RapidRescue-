/**
 * RapidRescue System Check Card
 *
 * Diagnostic component to inspect active environment parameters,
 * API contracts, and architecture readiness on physical device or emulator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Config } from '@/config/env';
import { StatusBadge } from './StatusBadge';
import { PulseDot } from './PulseDot';

export const SystemCheckCard: React.FC = () => {
  const { colors, borderRadius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <PulseDot color={colors.success} size={8} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            Phase 1 Foundation Active
          </Text>
        </View>
        <StatusBadge
          label={Config.env}
          variant={Config.isProduction ? 'success' : 'info'}
        />
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        The modular patient architecture is configured and ready for integration.
      </Text>

      {/* Parameter Rows */}
      <View style={[styles.metricsContainer, { backgroundColor: colors.backgroundElement, borderRadius: borderRadius.md }]}>
        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Ionicons name="server-outline" size={16} color={colors.accent} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>REST API Base</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
            {Config.apiBaseUrl}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Ionicons name="git-network-outline" size={16} color={colors.amber} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>WebSocket URL</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
            {Config.wsBaseUrl}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.metricRow}>
          <View style={styles.metricLabelGroup}>
            <Ionicons name="timer-outline" size={16} color={colors.success} />
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Req Timeout</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {Config.apiTimeoutMs} ms
          </Text>
        </View>
      </View>

      {/* Upcoming Phase Readiness Checklist */}
      <View style={styles.checklistSection}>
        <Text style={[styles.checklistHeader, { color: colors.textSecondary }]}>
          DEVELOPMENT BLUEPRINT
        </Text>
        
        <View style={styles.checkItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.checkText, { color: colors.text }]}>
            Phase 1: Project Foundation & Architecture
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.checkTextMuted, { color: colors.textMuted }]}>
            Phase 2: Authentication & Token Storage
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.checkTextMuted, { color: colors.textMuted }]}>
            Phase 3: Front Camera Photo & GPS Location
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.checkTextMuted, { color: colors.textMuted }]}>
            Phase 4: Backend Dispatch & Live Tracking
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons name="time-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.checkTextMuted, { color: colors.textMuted }]}>
            Phase 5: Emergency History & Resolution
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  metricsContainer: {
    padding: 12,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '55%',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  checklistSection: {
    marginTop: 4,
  },
  checklistHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkTextMuted: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default SystemCheckCard;
