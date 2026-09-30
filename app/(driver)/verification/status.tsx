import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../../src/theme';
import {
  Button,
  Card,
  Badge,
  ScreenWrapper,
  VerificationStatusBadge,
  MockStatusSimulator,
} from '../../../src/components';
import { useVerification } from '../../../src/context';
import { LEGAL_VERIFICATION_DISCLAIMER } from '../../../src/constants';

export default function VerificationStatusScreen() {
  const router = useRouter();
  const {
    profile,
    status,
    uploadedCount,
    totalCount,
    resubmitReview,
    isLoading,
  } = useVerification();

  const getStatusContent = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: '✓',
          title: 'Verification Approved',
          subtitle: 'Your driver verification has been approved.',
          badgeVariant: 'success' as const,
          description:
            'You are verified to respond to emergency ambulance dispatch calls on the RapidRescue network.',
          actionText: 'Return to Dashboard',
          actionHandler: () => router.replace('/(driver)/dashboard'),
        };
      case 'UNDER_REVIEW':
        return {
          icon: '⏳',
          title: 'Under Review',
          subtitle: 'Your documents are currently under review.',
          badgeVariant: 'info' as const,
          description:
            'RapidRescue dispatch coordinators are inspecting your driver licence and ambulance certifications.',
          actionText: 'View Uploaded Documents',
          actionHandler: () => router.push('/(driver)/verification'),
        };
      case 'PENDING':
        return {
          icon: '📋',
          title: 'Verification Pending',
          subtitle: 'Your documents have been submitted and are waiting for review.',
          badgeVariant: 'warning' as const,
          description:
            'All 6 documents have been received in the queue. You will be notified once coordinator review begins.',
          actionText: 'View Uploaded Documents',
          actionHandler: () => router.push('/(driver)/verification'),
        };
      case 'REJECTED':
        return {
          icon: '⚠️',
          title: 'Verification Rejected',
          subtitle:
            'Your verification requires changes before it can be submitted again.',
          badgeVariant: 'critical' as const,
          description:
            profile?.rejectionReason ||
            'One or more of your documents could not be verified. Please review the feedback and resubmit.',
          actionText: 'Resubmit for Review',
          actionHandler: async () => {
            await resubmitReview();
          },
        };
      case 'NOT_SUBMITTED':
      default:
        return {
          icon: '📄',
          title: 'Not Submitted',
          subtitle: 'Complete your required documents to submit for verification.',
          badgeVariant: 'default' as const,
          description:
            'All personal credentials and ambulance permits must be uploaded to start the review process.',
          actionText: 'Complete Verification Now',
          actionHandler: () => router.push('/(driver)/verification'),
        };
    }
  };

  const content = getStatusContent();
  const rejectedDocType = profile?.rejectedDocumentType;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.replace('/(driver)/dashboard')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
          >
            <Text style={styles.backText}>← Dashboard</Text>
          </Pressable>
          <VerificationStatusBadge status={status} />
        </View>

        {/* Main Status Emblem */}
        <View style={styles.statusEmblem}>
          <View
            style={[
              styles.iconCircle,
              status === 'VERIFIED' && styles.iconVerified,
              status === 'REJECTED' && styles.iconRejected,
              status === 'UNDER_REVIEW' && styles.iconReview,
              status === 'PENDING' && styles.iconPending,
            ]}
          >
            <Text style={styles.iconText}>{content.icon}</Text>
          </View>
          <Text style={styles.statusTitle}>{content.title}</Text>
          <Text style={styles.statusSubtitle}>{content.subtitle}</Text>
        </View>

        {/* Status Details Card */}
        <Card elevated style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Application Summary</Text>
            <Badge label={`${uploadedCount} / ${totalCount} Files`} variant="info" />
          </View>

          <Text style={styles.explanationText}>{content.description}</Text>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Driver ID:</Text>
              <Text style={styles.metaValueHighlight}>
                {profile?.driverId || 'RR-DRV-1001'}
              </Text>
            </View>

            {profile?.submittedAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submitted At:</Text>
                <Text style={styles.metaValue}>
                  {new Date(profile.submittedAt).toLocaleString()}
                </Text>
              </View>
            )}

            {profile?.reviewedAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last Evaluated:</Text>
                <Text style={styles.metaValue}>
                  {new Date(profile.reviewedAt).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dispatch Readiness:</Text>
              <Text
                style={[
                  styles.metaValue,
                  status === 'VERIFIED' ? styles.readyPositive : styles.readyWaiting,
                ]}
              >
                {status === 'VERIFIED' ? 'Ready for Dispatch' : 'Awaiting Full Approval'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Rejection Specific Correction Action */}
        {status === 'REJECTED' && rejectedDocType && (
          <Card elevated style={styles.rejectedDocCard}>
            <View style={styles.rejectedDocHeader}>
              <Text style={styles.rejectedDocTitle}>Action Required: Replace Document</Text>
              <Badge label="Needs Correction" variant="critical" />
            </View>
            <Text style={styles.rejectedDocDesc}>
              {profile?.rejectionReason || 'Document requires re-upload.'}
            </Text>
            <Button
              title="Replace This Document →"
              variant="danger"
              onPress={() =>
                router.push({
                  pathname: '/(driver)/verification/document',
                  params: { type: rejectedDocType },
                })
              }
              style={styles.replaceBtn}
            />
          </Card>
        )}

        {/* Main Action Button */}
        <View style={styles.actionsContainer}>
          <Button
            title={content.actionText}
            variant="primary"
            onPress={content.actionHandler}
            loading={isLoading}
            disabled={isLoading}
          />
          {status !== 'NOT_SUBMITTED' && (
            <Button
              title="Review Document List"
              variant="secondary"
              onPress={() => router.push('/(driver)/verification')}
            />
          )}
        </View>

        {/* Legal Disclaimer */}
        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Legal Verification Notice</Text>
          <Text style={styles.disclaimerText}>{LEGAL_VERIFICATION_DISCLAIMER}</Text>
        </Card>

        {/* Development Simulator */}
        <MockStatusSimulator />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  backButton: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusEmblem: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconVerified: {
    backgroundColor: Colors.successMuted,
    borderColor: Colors.success,
  },
  iconRejected: {
    backgroundColor: Colors.criticalMuted,
    borderColor: Colors.critical,
  },
  iconReview: {
    backgroundColor: Colors.secondaryMuted,
    borderColor: Colors.secondary,
  },
  iconPending: {
    backgroundColor: Colors.warningMuted,
    borderColor: Colors.warning,
  },
  iconText: {
    fontSize: 34,
    color: Colors.text,
    fontWeight: '700',
  },
  statusTitle: {
    ...Typography.h1,
    color: Colors.text,
    fontSize: 26,
    textAlign: 'center',
  },
  statusSubtitle: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  detailsCard: {
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  explanationText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  metaList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  metaLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.text,
  },
  metaValueHighlight: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  readyPositive: {
    color: Colors.success,
    fontWeight: '700',
  },
  readyWaiting: {
    color: Colors.warning,
    fontWeight: '600',
  },
  rejectedDocCard: {
    borderColor: Colors.critical,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  rejectedDocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rejectedDocTitle: {
    ...Typography.title,
    color: Colors.critical,
    fontSize: 15,
  },
  rejectedDocDesc: {
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  replaceBtn: {
    marginTop: Spacing.xs,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  disclaimerCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    marginVertical: Spacing.base,
    gap: 4,
  },
  disclaimerTitle: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
