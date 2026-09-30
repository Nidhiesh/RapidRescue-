import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../../src/theme';
import {
  Button,
  Card,
  Badge,
  ScreenWrapper,
  VerificationStatusBadge,
  VerificationProgressBar,
  DocumentCard,
  MockStatusSimulator,
} from '../../../src/components';
import { useVerification } from '../../../src/context';
import { LEGAL_VERIFICATION_DISCLAIMER } from '../../../src/constants';
import { VerificationDocumentType } from '../../../src/types';

export default function VerificationOverviewScreen() {
  const router = useRouter();
  const {
    status,
    documents,
    uploadedCount,
    totalCount,
    isAllUploaded,
    isLoading,
    submitReview,
    resubmitReview,
  } = useVerification();

  const driverDocKeys: VerificationDocumentType[] = [
    'DRIVING_LICENSE',
    'GOVERNMENT_ID',
    'DRIVER_SELFIE',
  ];

  const ambulanceDocKeys: VerificationDocumentType[] = [
    'AMBULANCE_REGISTRATION',
    'AMBULANCE_PERMIT',
    'VEHICLE_INSURANCE',
  ];

  const handleDocumentPress = (docType: VerificationDocumentType) => {
    router.push({
      pathname: '/(driver)/verification/document',
      params: { type: docType },
    });
  };

  const handleSubmit = async () => {
    let success = false;
    if (status === 'REJECTED') {
      success = await resubmitReview();
    } else {
      success = await submitReview();
    }

    if (success) {
      router.push('/(driver)/verification/status');
    }
  };

  const isSubmittedOrApproved =
    status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'VERIFIED';

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Driver Verification</Text>
          <Text style={styles.subtitle}>
            Submit your driving credentials and ambulance vehicle documents for review before
            becoming eligible for priority dispatch.
          </Text>
        </View>

        {/* Progress & Quick Status */}
        <Card elevated style={styles.progressCard}>
          <VerificationProgressBar
            uploadedCount={uploadedCount}
            totalCount={totalCount}
          />
          {status === 'REJECTED' && (
            <View style={styles.rejectionNotice}>
              <Text style={styles.rejectionNoticeText}>
                ⚠️ Your verification requires corrections. Please replace the highlighted document(s) below.
              </Text>
            </View>
          )}
        </Card>

        {/* Section 1: Driver Documents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1. Driver Documents</Text>
          <Badge label="Personal Credentials" variant="info" />
        </View>
        {driverDocKeys.map((key) => {
          const doc = documents[key];
          return (
            <DocumentCard
              key={key}
              document={doc}
              onPress={() => handleDocumentPress(key)}
            />
          );
        })}

        {/* Section 2: Ambulance Documents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>2. Ambulance Documents</Text>
          <Badge label="Vehicle Authorization" variant="info" />
        </View>
        {ambulanceDocKeys.map((key) => {
          const doc = documents[key];
          return (
            <DocumentCard
              key={key}
              document={doc}
              onPress={() => handleDocumentPress(key)}
            />
          );
        })}

        {/* Legal Disclaimer Box */}
        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Notice & Legal Disclaimer</Text>
          <Text style={styles.disclaimerText}>{LEGAL_VERIFICATION_DISCLAIMER}</Text>
        </Card>

        {/* Action Section */}
        <View style={styles.actionContainer}>
          {isSubmittedOrApproved ? (
            <Button
              title="View Verification Status →"
              variant="secondary"
              onPress={() => router.push('/(driver)/verification/status')}
            />
          ) : (
            <Button
              title={
                status === 'REJECTED'
                  ? 'Resubmit Documents for Review'
                  : isAllUploaded
                  ? 'Submit for Review'
                  : `Upload All Documents (${uploadedCount}/${totalCount})`
              }
              variant={isAllUploaded ? 'primary' : 'secondary'}
              onPress={handleSubmit}
              disabled={!isAllUploaded || isLoading}
              loading={isLoading}
            />
          )}
        </View>

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
  header: {
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.subtext,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  progressCard: {
    marginBottom: Spacing.lg,
  },
  rejectionNotice: {
    backgroundColor: Colors.criticalMuted,
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  rejectionNoticeText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.text,
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
  actionContainer: {
    marginTop: Spacing.base,
  },
});
