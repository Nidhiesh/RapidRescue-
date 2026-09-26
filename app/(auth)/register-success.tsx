import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import { Button, Card, Badge, ScreenWrapper } from '../../src/components';

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ driverName?: string; driverId?: string }>();

  const driverName = params.driverName || 'Emergency Driver';
  const driverId = params.driverId || 'RR-DRV-PENDING';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Badge label="Registration Recorded" variant="success" />
          <Text style={styles.title}>Welcome to RapidRescue</Text>
          <Text style={styles.subtitle}>
            Your driver profile has been successfully registered in the local mock repository.
          </Text>
        </View>

        {/* Driver Summary Card */}
        <Card elevated style={styles.summaryCard}>
          <Text style={styles.cardHeader}>Driver Credentials Summary</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Assigned Driver ID:</Text>
            <Text style={styles.dataValueHighlight}>{driverId}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Driver Name:</Text>
            <Text style={styles.dataValue}>{driverName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Status:</Text>
            <Text style={styles.dataValuePending}>Pending Verification</Text>
          </View>
        </Card>

        {/* Roadmap / Next Steps Card */}
        <Card style={styles.roadmapCard}>
          <Text style={styles.roadmapTitle}>Next Steps for Deployment</Text>
          
          <View style={styles.stepRow}>
            <View style={[styles.stepBullet, { backgroundColor: Colors.success }]}>
              <Text style={styles.stepBulletText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepName}>Account Created</Text>
              <Text style={styles.stepDesc}>Basic responder profile registered.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepBullet, { backgroundColor: Colors.warning }]}>
              <Text style={styles.stepBulletText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepName}>Document Verification (Phase 3)</Text>
              <Text style={styles.stepDesc}>
                Commercial driver's license and ambulance permits will be uploaded for verification.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepBullet, { backgroundColor: Colors.surfaceHighlight }]}>
              <Text style={styles.stepBulletText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepName}>Admin Approval & Live Dispatch</Text>
              <Text style={styles.stepDesc}>Verification status and emergency response activation.</Text>
            </View>
          </View>
        </Card>

        {/* Navigation Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="Proceed to Driver Login"
            variant="primary"
            onPress={() => router.replace('/(auth)/login')}
          />
          <Button
            title="Preview Driver Dashboard"
            variant="secondary"
            onPress={() => router.replace('/(driver)/dashboard')}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successMuted,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  checkmark: {
    fontSize: 36,
    color: Colors.success,
    fontWeight: 'bold',
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  summaryCard: {
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHeader: {
    ...Typography.title,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dataLabel: {
    ...Typography.subtext,
    color: Colors.textSecondary,
  },
  dataValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  dataValueHighlight: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  dataValuePending: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roadmapCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  roadmapTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 15,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBulletText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 14,
  },
  stepDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionContainer: {
    gap: Spacing.md,
  },
});
