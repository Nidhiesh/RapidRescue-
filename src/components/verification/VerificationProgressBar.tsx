import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface VerificationProgressBarProps {
  uploadedCount: number;
  totalCount: number;
}

export const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  uploadedCount,
  totalCount,
}) => {
  const percentage = Math.min(100, Math.round((uploadedCount / totalCount) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <Text style={styles.progressText}>
          {uploadedCount} of {totalCount} documents uploaded
        </Text>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percentage}%` },
            percentage === 100 && styles.fillComplete,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  percentageText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  fillComplete: {
    backgroundColor: Colors.success,
  },
});
