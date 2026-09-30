import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmergencyRequest, EmergencyRequestStatus, EmergencyPriority, DriverLocation } from '../../types';
import { resolveBackendMediaUrl } from '../../config/apiConfig';

interface EmergencyRequestCardProps {
  isVerified: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  requestStatus: EmergencyRequestStatus;
  currentRequest: EmergencyRequest | null;
  lastActionMessage: string | null;
  isCompleting?: boolean;
  completionError?: string | null;
  driverLocation?: DriverLocation | null;
  onClearCompletionError?: () => void;
  onSimulateEmergency: (priority?: EmergencyPriority) => { success: boolean; reason?: string };
  onCompleteEmergency: () => void;
  onOpenAlert: () => void;
  onOpenTrackingMap?: () => void;
}

export const EmergencyRequestCard: React.FC<EmergencyRequestCardProps> = ({
  isVerified,
  isOnline,
  isAvailable,
  requestStatus,
  currentRequest,
  lastActionMessage,
  isCompleting = false,
  completionError = null,
  driverLocation = null,
  onClearCompletionError,
  onSimulateEmergency,
  onCompleteEmergency,
  onOpenAlert,
  onOpenTrackingMap,
}) => {
  const [simulationFeedback, setSimulationFeedback] = useState<string | null>(null);
  const [showSimMenu, setShowSimMenu] = useState<boolean>(false);

  const handleSimulate = (priority: EmergencyPriority) => {
    const result = onSimulateEmergency(priority);
    if (!result.success && result.reason) {
      setSimulationFeedback(result.reason);
      setTimeout(() => setSimulationFeedback(null), 4000);
    } else {
      setSimulationFeedback(null);
      setShowSimMenu(false);
    }
  };

  const handleCompletePress = () => {
    Alert.alert(
      'Complete Emergency',
      'Confirm emergency incident completion? This will update dispatch and set your status to AVAILABLE.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Emergency',
          style: 'default',
          onPress: () => onCompleteEmergency(),
        },
      ]
    );
  };

  // State 1: Active Mission Screen (ACCEPTED + BUSY)
  if (requestStatus === 'ACCEPTED' && currentRequest) {
    const displayId = currentRequest.emergencyId || currentRequest.id;
    const distanceStr =
      currentRequest.distanceKm !== undefined
        ? `${currentRequest.distanceKm} km`
        : currentRequest.estimatedDistance || 'In Sector';
    const etaStr =
      currentRequest.etaMinutes !== undefined
        ? `${currentRequest.etaMinutes} min`
        : currentRequest.estimatedResponseTime || 'Calculating...';

    const patientName = currentRequest.patient?.name || currentRequest.patientName || 'Emergency Patient';
    const patientPhone = currentRequest.patient?.phone || currentRequest.patientPhone || 'Direct Dispatch Relay';
    const emergencyType = currentRequest.emergencyType || 'EMERGENCY DISPATCH';
    const rawPhoto = currentRequest.patient?.photoUrl || currentRequest.patientPhotoUrl;
    const patientPhotoUri = resolveBackendMediaUrl(rawPhoto);

    return (
      <Card elevated style={styles.assignedCard}>
        {/* Active Mission Header */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleCol}>
            <View style={styles.badgeRow}>
              <Badge label="ACTIVE EMERGENCY" variant="critical" />
              <Badge
                label={currentRequest.priority}
                variant={currentRequest.priority === 'CRITICAL' ? 'critical' : 'warning'}
              />
              <Badge label="ACCEPTED" variant="success" />
              <Badge label="BUSY" variant="warning" />
            </View>
            <Text style={styles.missionTitle}>Active Mission #{displayId}</Text>
          </View>
        </View>

        {/* Priority Banner */}
        <View style={styles.typeBlock}>
          <Text style={styles.typeLabel}>ASSIGNED MISSION</Text>
          <Text style={styles.typeVal}>
            {currentRequest.priority} PRIORITY — {emergencyType}
          </Text>
        </View>

        {/* Patient Contact Card */}
        <View style={styles.patientInfoCard}>
          <View style={styles.patientPhotoContainer}>
            {patientPhotoUri ? (
              <Image source={{ uri: patientPhotoUri }} style={styles.patientPhoto} />
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
            <Text style={styles.patientSubDetail}>Type: {emergencyType}</Text>
          </View>
        </View>

        {/* Contract Data: Emergency ID, Priority, Coordinates, Status */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency ID:</Text>
            <Text style={styles.infoValue}>{displayId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Priority:</Text>
            <Text style={styles.infoValue}>{currentRequest.priority}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient Pickup:</Text>
            <Text style={styles.locationValue}>
              {currentRequest.pickupLatitude.toFixed(5)}° N, {currentRequest.pickupLongitude.toFixed(5)}° E
            </Text>
          </View>
          {currentRequest.pickupAddress ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup Address:</Text>
              <Text style={styles.infoValue}>{currentRequest.pickupAddress}</Text>
            </View>
          ) : null}
          {driverLocation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Driver GPS:</Text>
              <Text style={styles.locationValue}>
                {driverLocation.latitude.toFixed(5)}° N, {driverLocation.longitude.toFixed(5)}° E
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mission State:</Text>
            <Text style={styles.statusAcceptedVal}>ACCEPTED (Confirmed)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver Status:</Text>
            <Text style={styles.statusBusyVal}>BUSY (Responding)</Text>
          </View>
        </View>

        {/* Distance, ETA & Telemetry Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>DISTANCE</Text>
            <Text style={styles.metricText}>{distanceStr}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ESTIMATED ETA</Text>
            <Text style={styles.metricTextHighlight}>{etaStr}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>GPS TELEMETRY</Text>
            <Text style={styles.metricTextHighlight}>15s STREAMING</Text>
          </View>
        </View>

        {/* Telemetry Indicator Note */}
        <View style={styles.telemetryNotice}>
          <Text style={styles.telemetryDot}>●</Text>
          <Text style={styles.telemetryText}>
            GPS coordinates continuously syncing with dispatch every 15 seconds.
          </Text>
        </View>

        {/* Completion Error Banner (if error occurred during POST /api/v1/dispatch/complete) */}
        {completionError && (
          <View style={styles.completionErrorBox}>
            <View style={styles.completionErrorHeader}>
              <Text style={styles.completionErrorTitle}>⚠️ Completion Failed</Text>
              {onClearCompletionError && (
                <TouchableOpacity onPress={onClearCompletionError}>
                  <Text style={styles.dismissErrorText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.completionErrorText}>{completionError}</Text>
            <Text style={styles.completionRetryHint}>
              Active mission preserved. Please check connectivity and tap Complete to retry.
            </Text>
          </View>
        )}

        {/* Live Tracking Map Navigation Button */}
        {onOpenTrackingMap && (
          <Button
            title="🗺️ OPEN LIVE TRACKING MAP →"
            variant="secondary"
            onPress={onOpenTrackingMap}
            style={styles.trackingMapBtn}
          />
        )}

        {/* Complete Emergency Action */}
        <Button
          title={isCompleting ? 'Completing emergency...' : 'COMPLETE EMERGENCY'}
          variant="primary"
          loading={isCompleting}
          disabled={isCompleting}
          onPress={handleCompletePress}
          style={styles.completeBtn}
        />
      </Card>
    );
  }

  // State 2: Incoming Request (in case alert was minimized)
  if (requestStatus === 'INCOMING' && currentRequest) {
    const displayId = currentRequest.emergencyId || currentRequest.id;
    return (
      <Card elevated style={styles.incomingCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.incomingTitle}>Incoming Emergency Alert!</Text>
            <Text style={styles.incomingSubtitle}>Pending driver confirmation</Text>
          </View>
          <Badge label="ACTION REQUIRED" variant="critical" />
        </View>

        <Text style={styles.incomingType}>
          {currentRequest.priority} Priority Dispatch (#{displayId})
        </Text>
        <Text style={styles.incomingAddress}>
          Pickup: {currentRequest.pickupAddress || `${currentRequest.pickupLatitude.toFixed(5)}° N, ${currentRequest.pickupLongitude.toFixed(5)}° E`}
        </Text>

        <Button
          title="Open Emergency Response Window →"
          variant="primary"
          onPress={onOpenAlert}
          style={styles.openAlertBtn}
        />
      </Card>
    );
  }

  // State 3: Standby / Ready / Offline
  return (
    <Card style={styles.standbyCard}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>Emergency Dispatch Queue</Text>
          <Text style={styles.cardSubtitle}>Real-time allocation listener</Text>
        </View>
        <Badge
          label={isOnline && isAvailable ? 'LISTENING' : isOnline ? 'BUSY' : 'STANDBY'}
          variant={isOnline && isAvailable ? 'success' : 'default'}
        />
      </View>

      {/* Action feedback message if any */}
      {lastActionMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{lastActionMessage}</Text>
        </View>
      )}

      {/* Body content */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderIcon}>🚨</Text>
        <Text style={styles.placeholderMainText}>
          {isVerified && isOnline && isAvailable
            ? 'No active emergency'
            : !isVerified
            ? 'Verification required'
            : "You're offline"}
        </Text>
        <Text style={styles.placeholderSubtext}>
          {isVerified && isOnline && isAvailable
            ? "You're online and ready to receive dispatch requests."
            : !isVerified
            ? 'Complete driver verification before going online.'
            : "Go online when you're ready to receive emergency requests."}
        </Text>
      </View>

      {/* Development simulator trigger */}
      {isVerified && isOnline && (
        <View style={styles.simulatorContainer}>
          <TouchableOpacity
            style={styles.simToggleBtn}
            onPress={() => setShowSimMenu(!showSimMenu)}
            activeOpacity={0.7}
          >
            <Text style={styles.simToggleText}>
              ⚡ DEV DEMO: Simulate Incoming Emergency {showSimMenu ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showSimMenu && (
            <View style={styles.simMenu}>
              <Text style={styles.simMenuDesc}>
                Trigger a mock emergency dispatch alert to test reception, countdown, and response actions:
              </Text>

              <View style={styles.simButtonRow}>
                <TouchableOpacity
                  style={[styles.simPriorityBtn, styles.btnCritical]}
                  onPress={() => handleSimulate('CRITICAL')}
                >
                  <Text style={styles.simBtnText}>CRITICAL (20s)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simPriorityBtn, styles.btnHigh]}
                  onPress={() => handleSimulate('HIGH')}
                >
                  <Text style={styles.simBtnText}>HIGH (40s)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simPriorityBtn, styles.btnNormal]}
                  onPress={() => handleSimulate('NORMAL')}
                >
                  <Text style={styles.simBtnText}>NORMAL (60s)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {simulationFeedback && (
            <View style={styles.simErrorBanner}>
              <Text style={styles.simErrorText}>{simulationFeedback}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  standbyCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  assignedCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
    borderColor: Colors.critical,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  incomingCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
    borderColor: Colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    gap: 4,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  missionTitle: {
    ...Typography.title,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  cardTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  typeBlock: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  typeVal: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  patientInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patientPhotoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    ...Typography.title,
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
    fontWeight: '700',
    fontSize: 13,
  },
  patientPhoneText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  patientSubDetail: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  infoBlock: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 95,
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'monospace',
  },
  locationValue: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    flex: 1,
    fontFamily: 'monospace',
  },
  statusAcceptedVal: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
    flex: 1,
  },
  statusBusyVal: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricItem: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  metricText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  metricTextHighlight: {
    ...Typography.bodyMedium,
    color: Colors.warning,
    fontWeight: '700',
  },
  telemetryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  telemetryDot: {
    color: Colors.success,
    fontSize: 10,
  },
  telemetryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  completionErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: Colors.critical,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  completionErrorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionErrorTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
    fontSize: 11,
  },
  dismissErrorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  completionErrorText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 11,
  },
  completionRetryHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  trackingMapBtn: {
    marginTop: Spacing.xs,
    borderColor: Colors.secondary,
    borderWidth: 1.5,
  },
  completeBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primary,
  },
  incomingTitle: {
    ...Typography.bodyMedium,
    color: Colors.warning,
    fontWeight: '700',
  },
  incomingSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  incomingType: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  incomingAddress: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  openAlertBtn: {
    marginTop: Spacing.xs,
  },
  feedbackBanner: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  feedbackText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 11,
  },
  placeholderBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  placeholderIcon: {
    fontSize: 26,
  },
  placeholderMainText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  simulatorContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  simToggleBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  simToggleText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  simMenu: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    gap: Spacing.xs,
  },
  simMenuDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  simButtonRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  simPriorityBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  btnCritical: {
    backgroundColor: Colors.criticalMuted,
    borderWidth: 1,
    borderColor: Colors.critical,
  },
  btnHigh: {
    backgroundColor: Colors.warningMuted,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  btnNormal: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  simBtnText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
  simErrorBanner: {
    backgroundColor: Colors.criticalMuted,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  simErrorText: {
    ...Typography.caption,
    color: Colors.critical,
    fontSize: 10,
  },
});
