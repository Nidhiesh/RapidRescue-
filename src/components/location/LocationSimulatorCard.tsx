import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface LocationSimulatorCardProps {
  isSimulatorMode: boolean;
  onToggleSimulator: () => void;
  isOnline: boolean;
}

/**
 * Development Location Simulator
 * 
 * Provides a mock GPS provider with simulated coordinate jitter for testing
 * ambulance operational duty flows without requiring physical device movement.
 * Clearly demarcated as development-only.
 */
export const LocationSimulatorCard: React.FC<LocationSimulatorCardProps> = ({
  isSimulatorMode,
  onToggleSimulator,
  isOnline,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <Card elevated style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <View style={styles.headerTitleContainer}>
          <View style={styles.tagRow}>
            <Badge label="DEV ONLY" variant="warning" />
            <Text style={styles.title}>Development Location Simulator</Text>
          </View>
          <Text style={styles.subtitle}>
            {isSimulatorMode ? 'Simulated Telemetry Active' : 'Real GPS Hardware Active'}
          </Text>
        </View>

        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.body}>
          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Simulate GPS Position</Text>
              <Text style={styles.switchDescription}>
                Use mock Coimbatore ambulance node (11.0168° N, 76.9558° E) with subtle jitter
              </Text>
            </View>
            <Switch
              value={isSimulatorMode}
              onValueChange={onToggleSimulator}
              trackColor={{ false: Colors.border, true: Colors.warning }}
              thumbColor={isSimulatorMode ? Colors.surfaceElevated : Colors.textMuted}
            />
          </View>

          {isOnline && (
            <View style={styles.warningNote}>
              <Text style={styles.warningNoteText}>
                ⚠️ Note: Toggling simulator mode will automatically reset duty to OFFLINE to rebind location service telemetry.
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • Real GPS uses device foreground location via expo-location.{'\n'}
              • Simulator emits fictitious updates every 4s for UI and lifecycle testing.{'\n'}
              • No real user locations or server transmissions are executed in Phase 5.
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.sm,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  expandIcon: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  body: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  switchDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  warningNote: {
    backgroundColor: Colors.warningMuted,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  warningNoteText: {
    ...Typography.caption,
    color: Colors.warning,
    fontSize: 10,
    lineHeight: 14,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
});
