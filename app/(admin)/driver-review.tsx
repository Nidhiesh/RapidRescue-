import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import {
  Button,
  Card,
  Badge,
  ScreenWrapper,
  VerificationStatusBadge,
} from '../../src/components';
import { useAdmin, useVerification, useAuth } from '../../src/context';
import { verificationService } from '../../src/services';
import {
  VerificationProfile,
  VerificationDocument,
  VerificationDocumentType,
} from '../../src/types';

export default function AdminDriverReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ driverId?: string }>();
  const driverId = params.driverId || 'RR-DRV-1001';

  const { session: authSession, status: authStatus } = useAuth();
  const { isAuthenticated, adminId } = useAdmin();
  const { refreshProfile } = useVerification();

  const isActuallyAdmin = isAuthenticated || authSession?.role === 'ADMIN';

  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<VerificationDocument | null>(null);

  // Approval confirmation modal state
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedRejectDoc, setSelectedRejectDoc] = useState<VerificationDocumentType>('VEHICLE_INSURANCE');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Access guard
  useEffect(() => {
    if (authStatus === 'INITIALIZING') {
      return;
    }
    if (!isActuallyAdmin) {
      router.replace('/(auth)/login');
    }
  }, [authStatus, isActuallyAdmin, router]);

  const loadDriver = useCallback(async () => {
    try {
      const data = await verificationService.getVerificationProfile(driverId);
      setProfile(data);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (isActuallyAdmin) {
      loadDriver();
    }
  }, [isActuallyAdmin, loadDriver]);

  // Mark as UNDER_REVIEW if PENDING
  const handleStartReview = async () => {
    setActionLoading(true);
    try {
      const updated = await verificationService.startReview(driverId, adminId || 'RR-ADM-001');
      setProfile(updated);
      setFeedbackMessage('Driver status updated to Under Review.');
      await refreshProfile();
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Approval
  const handleApprove = async () => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const updated = await verificationService.approveDriver(
        driverId,
        adminId || 'RR-ADM-001'
      );
      setProfile(updated);
      setShowApproveModal(false);
      setFeedbackMessage('✓ Driver verification has been officially approved! Operational eligibility granted.');
      await refreshProfile();
    } catch (err: unknown) {
      setShowApproveModal(false);
      setFeedbackMessage(
        err instanceof Error ? err.message : 'Failed to approve driver on dispatch server.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Rejection
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError('A specific reason for rejection is required.');
      return;
    }

    setActionLoading(true);
    setRejectionError(null);
    setFeedbackMessage(null);
    try {
      const updated = await verificationService.rejectDriver(
        driverId,
        adminId || 'RR-ADM-001',
        rejectionReason.trim(),
        selectedRejectDoc
      );
      setProfile(updated);
      setShowRejectModal(false);
      setFeedbackMessage('Driver verification rejected with feedback.');
      await refreshProfile();
    } catch (err: unknown) {
      setShowRejectModal(false);
      setFeedbackMessage(
        err instanceof Error ? err.message : 'Failed to reject driver on dispatch server.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <ScreenWrapper>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading driver verification file...</Text>
        </View>
      </ScreenWrapper>
    );
  }

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

  const renderDocumentRow = (docType: VerificationDocumentType) => {
    const doc = profile.documents[docType];
    const isAttached = doc?.status === 'UPLOADED' || doc?.status === 'REJECTED';

    return (
      <Card elevated key={docType} style={styles.docRowCard}>
        <View style={styles.docHeader}>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docName}>{doc?.name}</Text>
            <Text style={styles.docFileName} numberOfLines={1}>
              {doc?.fileName || 'No file uploaded'}
            </Text>
          </View>
          <Badge
            label={doc?.status === 'UPLOADED' ? 'Attached ✓' : doc?.status === 'REJECTED' ? 'Flagged' : 'Missing'}
            variant={doc?.status === 'UPLOADED' ? 'success' : doc?.status === 'REJECTED' ? 'critical' : 'warning'}
          />
        </View>

        {doc?.uploadedAt && (
          <Text style={styles.docUploadDate}>
            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
          </Text>
        )}

        {doc?.rejectionReason && (
          <View style={styles.docRejectNote}>
            <Text style={styles.docRejectNoteText}>Feedback: {doc.rejectionReason}</Text>
          </View>
        )}

        <View style={styles.docActionRow}>
          <Pressable
            disabled={!isAttached}
            onPress={() => setPreviewDoc(doc)}
            style={({ pressed }) => [
              styles.viewDocBtn,
              !isAttached && styles.viewDocBtnDisabled,
              pressed && styles.viewDocBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`View document ${doc?.name}`}
          >
            <Text style={[styles.viewDocText, !isAttached && styles.viewDocTextDisabled]}>
              {isAttached ? 'INSPECT DOCUMENT 🔍' : 'FILE NOT SUBMITTED'}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.replace('/(admin)/dashboard')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Admin Dashboard"
          >
            <Text style={styles.backText}>← Admin Dashboard</Text>
          </Pressable>
          <VerificationStatusBadge status={profile.status} />
        </View>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Driver Verification Review</Text>
          <Text style={styles.subtitle}>
            Assigned Application File: <Text style={styles.driverIdHighlight}>{profile.driverId}</Text>
          </Text>
        </View>

        {/* Driver Information Card */}
        <Card elevated style={styles.driverInfoCard}>
          <Text style={styles.cardHeaderTitle}>Driver Profile Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name:</Text>
            <Text style={styles.infoValue}>{profile.driverName || 'Gokul (Driver)'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number:</Text>
            <Text style={styles.infoValue}>{profile.mobileNumber || '9876543210'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile.email || 'gokul.driver@rapidrescue.org'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driving Experience:</Text>
            <Text style={styles.infoValue}>{profile.yearsOfExperience ?? 5} Years</Text>
          </View>
          {profile.submittedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Application Submitted:</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.submittedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
          {profile.reviewedBy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Reviewer:</Text>
              <Text style={styles.infoValueHighlight}>{profile.reviewedBy}</Text>
            </View>
          )}
        </Card>

        {/* Operational Eligibility Badge Card */}
        {profile.status === 'VERIFIED' && (
          <Card elevated style={styles.verifiedEligibilityCard}>
            <View style={styles.verifiedEligibilityHeader}>
              <Text style={styles.verifiedEligibilityTitle}>✓ Operational Eligibility Granted</Text>
              <Badge label="ACTIVE & AUTHORIZED" variant="success" />
            </View>
            <Text style={styles.verifiedEligibilityDesc}>
              This driver has been officially approved. They are granted operational eligibility to go ONLINE, broadcast real-time GPS tracking, and accept priority ambulance dispatch calls.
            </Text>
          </Card>
        )}

        {/* Review Status Control */}
        {profile.status === 'PENDING' && (
          <Card style={styles.startReviewCard}>
            <View style={styles.startReviewHeader}>
              <Text style={styles.startReviewTitle}>Application Pending Review</Text>
              <Badge label="Queue Item" variant="warning" />
            </View>
            <Text style={styles.startReviewDesc}>
              Acknowledge receipt and flag application as currently under active review.
            </Text>
            <Button
              title="Mark as Under Review"
              variant="secondary"
              onPress={handleStartReview}
              loading={actionLoading}
              disabled={actionLoading}
              style={styles.startReviewBtn}
            />
          </Card>
        )}

        {/* Section 1: Driver Documents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1. Driver Personal Documents</Text>
          <Badge label="Personal Identity" variant="info" />
        </View>
        {driverDocKeys.map(renderDocumentRow)}

        {/* Section 2: Ambulance Documents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>2. Ambulance Vehicle Documents</Text>
          <Badge label="Vehicle Permits" variant="info" />
        </View>
        {ambulanceDocKeys.map(renderDocumentRow)}

        {/* Review Decisions Section */}
        <View style={styles.decisionSection}>
          <Text style={styles.decisionTitle}>Administrative Decision</Text>
          <Text style={styles.decisionDesc}>
            Verify all 6 documents against transport authority regulations before approving.
          </Text>

          <View style={styles.actionButtonsCol}>
            <Button
              title="✓ APPROVE DRIVER (GRANT OPERATIONAL ELIGIBILITY)"
              variant="primary"
              onPress={() => setShowApproveModal(true)}
              disabled={actionLoading || profile.status === 'VERIFIED'}
            />

            <Button
              title="✕ REJECT WITH CORRECTION FEEDBACK"
              variant="danger"
              onPress={() => setShowRejectModal(true)}
              disabled={actionLoading}
            />
          </View>
        </View>
      </ScrollView>

      {/* ================= DOCUMENT INSPECT MODAL ================= */}
      <Modal visible={Boolean(previewDoc)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewDoc?.name}</Text>
              <Pressable
                onPress={() => setPreviewDoc(null)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Preview"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.previewContainer}>
              {previewDoc?.mimeType === 'application/pdf' ? (
                <View style={styles.pdfCard}>
                  <Text style={styles.pdfLargeIcon}>📑</Text>
                  <Text style={styles.pdfTitle}>{previewDoc.fileName}</Text>
                  <Text style={styles.pdfInfo}>PDF Document • Official Ambulance File</Text>
                  <Badge label="DOCUMENT CONTENT VERIFIED" variant="info" />
                </View>
              ) : previewDoc?.uri ? (
                <Image
                  source={{ uri: previewDoc.uri }}
                  style={styles.fullPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.noPreviewText}>Preview not available.</Text>
              )}
            </View>

            <View style={styles.modalMetaBlock}>
              <Text style={styles.modalMetaText}>Type: {previewDoc?.mimeType}</Text>
              <Text style={styles.modalMetaText}>Category: {previewDoc?.category}</Text>
            </View>

            <Button
              title="Close Preview"
              variant="secondary"
              onPress={() => setPreviewDoc(null)}
            />
          </View>
        </View>
      </Modal>

      {/* ================= APPROVE CONFIRMATION MODAL ================= */}
      <Modal visible={showApproveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConfirmBox}>
            <View style={styles.approveIconCircle}>
              <Text style={styles.approveCheck}>✓</Text>
            </View>

            <Text style={styles.confirmTitle}>Approve this driver?</Text>
            <Text style={styles.confirmDesc}>
              Approving this driver will mark the driver as <Text style={styles.verifiedText}>VERIFIED</Text> and unlock future operational ambulance features.
            </Text>

            <View style={styles.confirmActions}>
              <Button
                title="Confirm & Approve"
                variant="primary"
                onPress={handleApprove}
                loading={actionLoading}
                disabled={actionLoading}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowApproveModal(false)}
                disabled={actionLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= REJECT REASON MODAL ================= */}
      <Modal visible={showRejectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalRejectBox}>
            <Text style={styles.rejectModalTitle}>Reject Driver Verification</Text>
            <Text style={styles.rejectModalSubtitle}>
              Specify which document requires replacement and provide feedback for the driver.
            </Text>

            {rejectionError && (
              <View style={styles.rejectErrorAlert}>
                <Text style={styles.rejectErrorText}>{rejectionError}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>FLAGGED DOCUMENT</Text>
            <View style={styles.docSelectorRow}>
              {[
                { label: 'Insurance', val: 'VEHICLE_INSURANCE' as const },
                { label: 'Driving Licence', val: 'DRIVING_LICENSE' as const },
                { label: 'RC Book', val: 'AMBULANCE_REGISTRATION' as const },
                { label: 'Selfie', val: 'DRIVER_SELFIE' as const },
              ].map((item) => (
                <Pressable
                  key={item.val}
                  onPress={() => setSelectedRejectDoc(item.val)}
                  style={[
                    styles.selectorPill,
                    selectedRejectDoc === item.val && styles.selectorPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      selectedRejectDoc === item.val && styles.selectorPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>REJECTION REASON</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g. Vehicle insurance document is expired."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              style={styles.reasonInput}
            />

            <View style={styles.confirmActions}>
              <Button
                title="Confirm Rejection & Send Feedback"
                variant="danger"
                onPress={handleReject}
                loading={actionLoading}
                disabled={actionLoading}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowRejectModal(false)}
                disabled={actionLoading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
  feedbackBanner: {
    backgroundColor: Colors.secondaryMuted,
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  feedbackText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    marginBottom: Spacing.base,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    fontSize: 24,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  driverIdHighlight: {
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  driverInfoCard: {
    marginBottom: Spacing.base,
    gap: Spacing.xs,
  },
  cardHeaderTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  infoValueHighlight: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  startReviewCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.warningMuted,
    marginBottom: Spacing.base,
    gap: Spacing.xs,
  },
  startReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startReviewTitle: {
    ...Typography.title,
    color: Colors.warning,
    fontSize: 15,
  },
  startReviewDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  startReviewBtn: {
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 15,
  },
  docRowCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docTitleBlock: {
    flex: 1,
  },
  docName: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 14,
  },
  docFileName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  docUploadDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  docRejectNote: {
    backgroundColor: Colors.criticalMuted,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  docRejectNoteText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '600',
  },
  docActionRow: {
    marginTop: Spacing.xs,
  },
  viewDocBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDocBtnDisabled: {
    opacity: 0.4,
  },
  viewDocBtnPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  viewDocText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
  },
  viewDocTextDisabled: {
    color: Colors.textMuted,
  },
  decisionSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  decisionTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  decisionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actionButtonsCol: {
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalCloseText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  previewContainer: {
    height: 280,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewImage: {
    width: '100%',
    height: '100%',
  },
  pdfCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  pdfLargeIcon: {
    fontSize: 54,
  },
  pdfTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  pdfInfo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noPreviewText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  modalMetaBlock: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  modalMetaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalConfirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    gap: Spacing.md,
  },
  approveIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successMuted,
    borderWidth: 2,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveCheck: {
    fontSize: 32,
    color: Colors.success,
    fontWeight: 'bold',
  },
  confirmTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    fontSize: 20,
  },
  confirmDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifiedText: {
    color: Colors.success,
    fontWeight: '700',
  },
  confirmActions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalRejectBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.critical,
    gap: Spacing.sm,
  },
  rejectModalTitle: {
    ...Typography.h2,
    color: Colors.critical,
    fontSize: 18,
  },
  rejectModalSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rejectErrorAlert: {
    backgroundColor: Colors.criticalMuted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  rejectErrorText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  docSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  selectorPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorPillActive: {
    borderColor: Colors.critical,
    backgroundColor: Colors.criticalMuted,
  },
  selectorPillText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  selectorPillTextActive: {
    color: Colors.critical,
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    color: Colors.text,
    ...Typography.body,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  verifiedEligibilityCard: {
    backgroundColor: '#052E16',
    borderColor: '#10B981',
    borderWidth: 1.5,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
  },
  verifiedEligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  verifiedEligibilityTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: '#34D399',
  },
  verifiedEligibilityDesc: {
    ...Typography.caption,
    color: '#D1FAE5',
    lineHeight: 18,
  },
});
