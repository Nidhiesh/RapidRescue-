import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { EmergencyPriority } from '../../types';

interface EmergencyCountdownProps {
  secondsRemaining: number;
  totalSeconds: number;
  priority: EmergencyPriority;
}

export const EmergencyCountdown: React.FC<EmergencyCountdownProps> = ({
  secondsRemaining,
  totalSeconds,
  priority,
}) => {
  const percentage = Math.max(0, Math.min(100, (secondsRemaining / (totalSeconds || 1)) * 100));

  // Determine urgency tier & color
  const getUrgencyInfo = () => {
    if (secondsRemaining <= 0) {
      return {
        color: Colors.critical,
        label: 'RESPONSE WINDOW EXPIRED',
        badge: 'TIMED OUT',
      };
    }
    if (secondsRemaining <= 5) {
      return {
        color: Colors.critical,
        label: 'CRITICAL: EXPIRES IN SECONDS!',
        badge: 'ACTION REQUIRED',
      };
    }
    if (secondsRemaining <= 10) {
      return {
        color: Colors.warning,
        label: 'URGENT: COUNTDOWN RUNNING',
        badge: 'DECISION PENDING',
      };
    }
    return {
      color: priority === 'CRITICAL' ? Colors.critical : Colors.success,
      label: 'RESPONSE WINDOW OPEN',
      badge: 'OFFER PENDING',
    };
  };

  const urgency = getUrgencyInfo();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.labelCol}>
          <Text style={styles.sectionLabel}>SERVER DEADLINE COUNTDOWN</Text>
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {urgency.label}
          </Text>
        </View>

        {/* Large prominent timer digits */}
        <View style={[styles.timerPill, { borderColor: urgency.color }]}>
          <Text style={[styles.timerValue, { color: urgency.color }]}>
            {secondsRemaining}s
          </Text>
        </View>
      </View>

      {/* High-visibility progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: urgency.color,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.subtext}>
          Backend source of truth. Driver pool automatically reclaims offer at 0s.
        </Text>
        <Text style={[styles.secondsFraction, { color: urgency.color }]}>
          {secondsRemaining} / {totalSeconds}s
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCol: {
    gap: 2,
    flex: 1,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  urgencyText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timerPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    minWidth: 64,
    alignItems: 'center',
  },
  timerValue: {
    ...Typography.h2,
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'monospace',
    lineHeight: 30,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  subtext: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    flex: 1,
  },
  secondsFraction: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: Spacing.xs,
  },
});
