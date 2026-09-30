import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { VerificationStatusBadge } from '../verification/VerificationStatusBadge';
import { DriverVerificationSummary } from '../../types';

interface DriverVerificationCardProps {
  driver: DriverVerificationSummary;
  onReview: (driverId: string) => void;
}

export const DriverVerificationCard: React.FC<DriverVerificationCardProps> = ({
  driver,
  onReview,
}) => {
  return (
    <Card elevated style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.driverName}>{driver.driverName}</Text>
          <Text style={styles.driverId}>{driver.driverId}</Text>
        </View>
        <VerificationStatusBadge status={driver.status} />
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Mobile Number</Text>
          <Text style={styles.infoValue}>{driver.mobileNumber}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Documents</Text>
          <Text style={styles.infoValueHighlight}>
            {driver.documentsCount} / {driver.totalRequired} Attached
          </Text>
        </View>
      </View>

      {driver.submittedAt && (
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Submitted: {new Date(driver.submittedAt).toLocaleDateString()} at{' '}
            {new Date(driver.submittedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {driver.status === 'REJECTED' && driver.rejectionReason && (
        <View style={styles.rejectionNotice}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{driver.rejectionReason}</Text>
        </View>
      )}

      <Pressable
        onPress={() => onReview(driver.driverId)}
        style={({ pressed }) => [styles.reviewButton, pressed && styles.reviewButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Review verification documents for ${driver.driverName}`}
      >
        <Text style={styles.reviewButtonText}>REVIEW APPLICATION →</Text>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
  },
  driverName: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 17,
  },
  driverId: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCol: {
    gap: 2,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 13,
  },
  infoValueHighlight: {
    ...Typography.bodyMedium,
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  rejectionNotice: {
    backgroundColor: Colors.criticalMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  rejectionLabel: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  rejectionText: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 16,
  },
  reviewButton: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  reviewButtonPressed: {
    backgroundColor: Colors.primaryMuted,
  },
  reviewButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
