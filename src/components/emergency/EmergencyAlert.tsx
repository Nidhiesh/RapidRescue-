import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmergencyRequest } from '../../types';
import { EmergencyCountdown } from './EmergencyCountdown';
import { resolveBackendMediaUrl } from '../../config/apiConfig';

interface EmergencyAlertProps {
  visible: boolean;
  request: EmergencyRequest | null;
  countdownSeconds: number;
  totalDurationSeconds: number;
  isAccepting?: boolean;
  isRejecting?: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  visible,
  request,
  countdownSeconds,
  totalDurationSeconds,
  isAccepting = false,
  isRejecting = false,
  onAccept,
  onReject,
}) => {
  const [photoError, setPhotoError] = useState(false);

  if (!request) return null;

  const isCritical = request.priority === 'CRITICAL';
  const displayId = request.emergencyId || request.id;
  const distanceStr =
    request.distanceKm !== undefined
      ? `${request.distanceKm} km`
      : request.estimatedDistance || 'In Sector';
  const etaStr =
    request.etaMinutes !== undefined
      ? `${request.etaMinutes} min`
      : request.estimatedResponseTime || 'Calculated on dispatch';

  const patientName = request.patient?.name || request.patientName || 'Emergency Patient';
  const patientPhone = request.patient?.phone || request.patientPhone || 'Direct Dispatch Relay';
  const emergencyType = request.emergencyType || 'PRIORITY EMERGENCY';

  const rawPhoto = request.patient?.photoUrl || request.patientPhotoUrl;
  const patientPhotoUri = resolveBackendMediaUrl(rawPhoto);

  const formatDeadline = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime())
        ? null
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
  };

  const deadlineFormatted = formatDeadline(request.responseDeadline);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top Flasher / Emergency Bar */}
          <View style={[styles.alertHeaderBar, isCritical && styles.alertHeaderCritical]}>
            <View style={styles.headerLeft}>
              <Text style={styles.alertSirens}>🚨</Text>
              <Text style={styles.alertHeaderTitle}>EMERGENCY DISPATCH</Text>
            </View>
            <Badge label={request.priority} variant={isCritical ? 'critical' : 'warning'} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Countdown Timer */}
            <EmergencyCountdown
              secondsRemaining={countdownSeconds}
              totalSeconds={totalDurationSeconds}
              priority={request.priority}
            />

            {/* Emergency Priority Banner */}
            <View style={[styles.emergencyBannerCard, isCritical && styles.emergencyBannerCritical]}>
              <View style={styles.bannerRow}>
                <Text style={styles.sectionLabel}>TRIAGE PRIORITY</Text>
                <Text style={styles.emergencyIdText}>ID: #{displayId}</Text>
              </View>
              <Text style={styles.emergencyPriorityTitle}>
                {request.priority} PRIORITY — {emergencyType}
              </Text>
            </View>

            {/* Patient Information Card */}
            <View style={styles.patientCard}>
              <View style={styles.patientPhotoContainer}>
                {patientPhotoUri && !photoError ? (
                  <Image
                    source={{ uri: patientPhotoUri }}
                    style={styles.patientPhoto}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <View style={styles.patientAvatarFallback}>
                    <Text style={styles.patientAvatarText}>
                      {patientName ? patientName.charAt(0).toUpperCase() : 'P'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.patientDetails}>
                <Text style={styles.patientNameText}>{patientName}</Text>
                <Text style={styles.patientPhoneText}>📞 {patientPhone}</Text>
                <View style={styles.patientConditionBadge}>
                  <Text style={styles.patientConditionText}>Incident Type: {emergencyType}</Text>
                </View>
              </View>
            </View>

            {/* Incident Telemetry & Location Info */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Emergency ID</Text>
                <Text style={styles.infoValHighlight}>{displayId}</Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.locationBlock}>
                <Text style={styles.infoLabel}>Pickup Coordinates</Text>
                <Text style={styles.coordinatesLarge}>
                  {request.pickupLatitude.toFixed(5)}° N, {request.pickupLongitude.toFixed(5)}° E
                </Text>
              </View>

              {request.pickupAddress ? (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.locationBlock}>
                    <Text style={styles.infoLabel}>Pickup Address</Text>
                    <Text style={styles.addressLarge}>{request.pickupAddress}</Text>
                  </View>
                </>
              ) : null}

              {deadlineFormatted && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Server Deadline</Text>
                    <Text style={styles.infoValDeadline}>{deadlineFormatted}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Distance & ETA Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DISTANCE</Text>
                <Text style={styles.metricVal}>{distanceStr}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>ESTIMATED ETA</Text>
                <Text style={styles.metricVal}>{etaStr}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>COUNTDOWN</Text>
                <Text style={styles.metricValHighlight}>{countdownSeconds}s</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title={isRejecting ? 'Declining...' : 'REJECT'}
                variant="danger"
                onPress={onReject}
                disabled={isAccepting || isRejecting}
                loading={isRejecting}
                style={styles.rejectBtn}
              />
              <Button
                title={isAccepting ? 'Accepting emergency...' : 'ACCEPT EMERGENCY'}
                variant="primary"
                onPress={onAccept}
                disabled={isAccepting || isRejecting}
                loading={isAccepting}
                style={styles.acceptBtn}
              />
            </View>

            <Text style={styles.disclaimerText}>
              By accepting, you commit to responding immediately. Live GPS telemetry will lock into dispatch coordination.
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.critical,
    overflow: 'hidden',
  },
  alertHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  alertHeaderCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderBottomColor: Colors.critical,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertSirens: {
    fontSize: 20,
  },
  alertHeaderTitle: {
    ...Typography.bodyMedium,
    color: Colors.critical,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  emergencyBannerCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  emergencyBannerCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emergencyIdText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 10,
  },
  emergencyPriorityTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  patientPhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  patientAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '800',
  },
  patientDetails: {
    flex: 1,
    gap: 2,
  },
  patientNameText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  patientPhoneText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  patientConditionBadge: {
    marginTop: 2,
  },
  patientConditionText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoValHighlight: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  infoValDeadline: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  locationBlock: {
    gap: 2,
    marginTop: 2,
  },
  coordinatesLarge: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: 13,
    marginTop: 2,
  },
  addressLarge: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  metricVal: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  metricValHighlight: {
    ...Typography.bodyMedium,
    color: Colors.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  rejectBtn: {
    flex: 1,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.success,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },
});
