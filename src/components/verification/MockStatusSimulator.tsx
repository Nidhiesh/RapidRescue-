import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { VerificationStatus } from '../../types';
import { useVerification } from '../../context';

export const MockStatusSimulator: React.FC = () => {
  const { status, setMockStatus, isLoading } = useVerification();
  const [isOpen, setIsOpen] = useState(false);

  const states: { label: string; status: VerificationStatus; variant: 'default' | 'warning' | 'info' | 'success' | 'critical' }[] = [
    { label: 'Not Submitted', status: 'NOT_SUBMITTED', variant: 'default' },
    { label: 'Pending Review', status: 'PENDING', variant: 'warning' },
    { label: 'Under Review', status: 'UNDER_REVIEW', variant: 'info' },
    { label: 'Approved (Verified)', status: 'VERIFIED', variant: 'success' },
    { label: 'Rejected (Fix Insurance)', status: 'REJECTED', variant: 'critical' },
  ];

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel="Toggle Development Verification Simulator"
      >
        <View style={styles.titleRow}>
          <Badge label="DEV SIMULATOR ONLY" variant="warning" />
          <Text style={styles.title}>Verification Simulator</Text>
        </View>
        <Text style={styles.chevron}>{isOpen ? '▲ Collapse' : '▼ Expand'}</Text>
      </Pressable>

      {isOpen && (
        <View style={styles.body}>
          <Text style={styles.disclaimer}>
            Development tool to simulate state transitions and review scenarios without a live backend.
          </Text>

          <View style={styles.buttonsGrid}>
            {states.map((item) => {
              const isActive = status === item.status;
              return (
                <Pressable
                  key={item.status}
                  disabled={isLoading}
                  onPress={() => setMockStatus(item.status)}
                  style={({ pressed }) => [
                    styles.stateBtn,
                    isActive && styles.stateBtnActive,
                    pressed && styles.stateBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${item.label}`}
                >
                  <Text
                    style={[
                      styles.stateBtnText,
                      isActive && styles.stateBtnTextActive,
                    ]}
                  >
                    {item.label} {isActive ? '✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceHighlight,
    marginVertical: Spacing.base,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chevron: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  body: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  stateBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stateBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  stateBtnPressed: {
    opacity: 0.7,
  },
  stateBtnText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  stateBtnTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
});
