import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import {
  Card,
  Badge,
  ScreenWrapper,
  Button,
  VerificationStatusBadge,
  LocationDisplayCard,
  LocationSimulatorCard,
  EmergencyAlert,
  EmergencyRequestCard,
} from '../../src/components';
import { useAuth, useVerification } from '../../src/context';
import { useLocation, useEmergency } from '../../src/hooks';

export default function OperationalDriverDashboard() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { status: verificationStatus, uploadedCount, totalCount } = useVerification();
  const {
    dutyStatus,
    availability,
    trackingStatus,
    currentLocation,
    locationError,
    isConnecting,
    isSimulatorMode,
    toggleSimulatorMode,
    goOnline,
    goOffline,
    retryLocation,
  } = useLocation();

  const {
    currentRequest,
    requestStatus,
    isAlertVisible,
    countdownSeconds,
    totalDurationSeconds,
    isAccepting,
    isRejecting,
    lastActionMessage,
    isCompleting,
    completionError,
    clearCompletionError,
    acceptRequest,
    rejectRequest,
    completeEmergency,
    simulateIncomingEmergency,
    dismissAlert,
    openAlert,
  } = useEmergency();

  const isVerified = verificationStatus === 'VERIFIED';
  const isOnline = dutyStatus === 'ONLINE';
  const driverSession = session?.role === 'DRIVER' ? session : null;
  const driverDisplayName = driverSession?.fullName || driverSession?.displayName || driverSession?.name;

  const handleSignOut = async () => {
    if (isOnline) {
      await goOffline();
    }
    await logout();
    router.replace('/(auth)/login');
  };

  const handleGoOnlinePress = async () => {
    if (!isVerified) {
      return;
    }
    await goOnline(isVerified, driverSession?.driverId);
  };

  const handleGoOfflinePress = async () => {
    if (requestStatus === 'ACCEPTED' || availability === 'BUSY') {
      // Prevent transitioning from BUSY to OFFLINE while an active mission is assigned
      return;
    }
    await goOffline();
  };

  const handleRetryPress = async () => {
    await retryLocation(isVerified, driverSession?.driverId);
  };

  const handleAcceptEmergency = async () => {
    const success = await acceptRequest();
    if (success) {
      router.push('/(driver)/live-tracking');
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (e) {
      // Fallback
    }
  };

  const getVerificationActionLabel = () => {
    switch (verificationStatus) {
      case 'VERIFIED':
        return 'View Verified Credentials →';
      case 'REJECTED':
        return 'Verification Required (Action Needed) →';
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'Check Verification Status →';
      case 'NOT_SUBMITTED':
      default:
        return 'Complete Verification →';
    }
  };

  // Determine current Operational Dashboard UI State:
  // STATE 1: NOT VERIFIED
  // STATE 2: VERIFIED + OFFLINE
  // STATE 3: VERIFIED + CONNECTING (REQUESTING LOCATION)
  // STATE 4: VERIFIED + ONLINE
  // STATE 5: VERIFIED + OFFLINE WITH LOCATION ERROR (FAILURE)
  const isState1Unverified = !isVerified;
  const isState3Connecting = isVerified && isConnecting;
  const isState4Online = isVerified && isOnline && trackingStatus === 'ACTIVE';
  const isState5Failure =
    isVerified &&
    !isOnline &&
    (trackingStatus === 'PERMISSION_DENIED' ||
      trackingStatus === 'SERVICES_DISABLED' ||
      trackingStatus === 'ERROR' ||
      !!locationError);

  return (
    <ScreenWrapper>
      {/* High-Priority Incoming Emergency Alert Modal */}
      <EmergencyAlert
        visible={isAlertVisible}
        request={currentRequest}
        countdownSeconds={countdownSeconds}
        totalDurationSeconds={totalDurationSeconds}
        isAccepting={isAccepting}
        isRejecting={isRejecting}
        onAccept={handleAcceptEmergency}
        onReject={rejectRequest}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP: Branding & Driver Profile Summary */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="RR DRIVER" variant="info" />
            {isVerified ? (
              <Badge label="VERIFIED DRIVER ✓" variant="success" />
            ) : (
              <VerificationStatusBadge status={verificationStatus} isDashboard />
            )}
          </View>
          <Text style={styles.title}>Operational Dashboard</Text>
          <Text style={styles.subtitle}>
            {driverDisplayName ? `Officer ${driverDisplayName}` : 'Emergency Ambulance Operator'}
          </Text>
        </View>

        {isState1Unverified ? (
          // ==============================================================
          // UNVERIFIED DRIVER FLOW: Verification Required
          // ==============================================================
          <>
            <Card elevated style={[styles.verificationCard, verificationStatus === 'REJECTED' && styles.cardRejected]}>
              <View style={styles.verificationHeader}>
                <Text style={styles.verificationTitle}>Operational Authorization</Text>
                <VerificationStatusBadge status={verificationStatus} isDashboard />
              </View>

              <Text style={styles.verificationDesc}>
                {verificationStatus === 'REJECTED'
                  ? 'One or more submitted documents require corrections before dispatch eligibility can be granted.'
                  : verificationStatus === 'UNDER_REVIEW'
                  ? 'Your documents are currently under administrative review.'
                  : verificationStatus === 'PENDING'
                  ? 'Your documents have been submitted and are in the admin review queue.'
                  : 'Complete driver verification before going online.'}
              </Text>

              <View style={styles.lockedNotice}>
                <Text style={styles.lockedNoticeTitle}>🔒 Verification required</Text>
                <Text style={styles.lockedNoticeText}>
                  Complete driver verification before going online.
                </Text>
              </View>

              <View style={styles.docCountRow}>
                <Text style={styles.docCountText}>
                  Uploaded Documents: {uploadedCount} of {totalCount}
                </Text>
              </View>

              <Button
                title={getVerificationActionLabel()}
                variant={verificationStatus === 'REJECTED' ? 'danger' : 'primary'}
                onPress={() => router.push('/(driver)/verification')}
                style={styles.verificationBtn}
              />
            </Card>

            <Card elevated style={styles.lockedDutyCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.dutyCardTitle}>Ambulance Duty & Dispatch</Text>
                <Badge label="LOCKED" variant="critical" />
              </View>
              <Text style={styles.lockedDutyText}>
                Live duty status, GPS tracking, and ambulance dispatch are disabled.
                Once your verification is approved by administration, the GO ONLINE toggle will become active here.
              </Text>
            </Card>
          </>
        ) : (
          // ==============================================================
          // VERIFIED DRIVER FLOW: Main Status & Dispatch Top Priority
          // ==============================================================
          <>
            {/* MAIN STATUS & PRIMARY ACTION: Ambulance Duty Card */}
            <Card elevated style={[styles.dutyCard, isOnline && styles.dutyCardOnline]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.dutyCardTitle}>Ambulance Duty Status</Text>
                  <Text style={styles.dutyCardSubtitle}>
                    {isOnline
                      ? availability === 'BUSY'
                        ? 'Active emergency mission assigned'
                        : 'Ready to receive emergency requests.'
                      : isState3Connecting
                      ? 'Getting your location and connecting to dispatch...'
                      : "You're not receiving emergency requests."}
                  </Text>
                </View>

                {isOnline ? (
                  availability === 'BUSY' ? (
                    <View style={styles.badgeGroup}>
                      <Badge label="BUSY" variant="warning" />
                      <Badge label="ACTIVE EMERGENCY" variant="critical" />
                    </View>
                  ) : (
                    <View style={styles.badgeGroup}>
                      <Badge label="ONLINE" variant="success" />
                      <Badge label="AVAILABLE" variant="success" />
                    </View>
                  )
                ) : isState3Connecting ? (
                  <Badge label="CONNECTING..." variant="warning" />
                ) : (
                  <Badge label="OFFLINE" variant="default" />
                )}
              </View>

              {/* Status Overview Grid */}
              <View style={styles.statusGrid}>
                {/* Duty Status Tile */}
                <View style={styles.statusTile}>
                  <Text style={styles.tileLabel}>DUTY STATUS</Text>
                  <Text style={[styles.tileValue, isOnline ? styles.textOnline : styles.textOffline]}>
                    {isState3Connecting ? 'CONNECTING...' : dutyStatus}
                  </Text>
                </View>

                {/* Dispatch Availability Tile */}
                <View style={styles.statusTile}>
                  <Text style={styles.tileLabel}>AVAILABILITY</Text>
                  <Text
                    style={[
                      styles.tileValue,
                      availability === 'AVAILABLE'
                        ? styles.textAvailable
                        : availability === 'BUSY'
                        ? styles.textBusy
                        : styles.textUnavailable,
                    ]}
                  >
                    {availability}
                  </Text>
                </View>
              </View>

              {/* Primary Action Button based on Operational State */}
              {isState4Online ? (
                availability === 'BUSY' ? (
                  // STATE 4: ONLINE + BUSY -> Locked on active mission
                  <View style={styles.dutyActionBlock}>
                    <View style={styles.busyNotice}>
                      <Text style={styles.busyDot}>●</Text>
                      <Text style={styles.busyNoticeText}>
                        Active emergency mission assigned. Complete mission before going offline.
                      </Text>
                    </View>
                    <Button
                      title="GO OFFLINE (DISABLED — MISSION IN PROGRESS)"
                      variant="secondary"
                      disabled={true}
                      onPress={() => {}}
                      style={styles.disabledOfflineBtn}
                    />
                  </View>
                ) : (
                  // STATE 4: ONLINE + AVAILABLE -> Show GO OFFLINE
                  <View style={styles.dutyActionBlock}>
                    <View style={styles.onlineNotice}>
                      <Text style={styles.onlineDot}>●</Text>
                      <Text style={styles.onlineNoticeText}>
                        Ready to receive emergency requests.
                      </Text>
                    </View>
                    <Button
                      title="GO OFFLINE"
                      variant="danger"
                      onPress={handleGoOfflinePress}
                      style={styles.dutyBtn}
                    />
                  </View>
                )
              ) : isState3Connecting ? (
                // STATE 3: CONNECTING -> Show connecting text & loading indicator
                <View style={styles.dutyActionBlock}>
                  <View style={styles.connectingNotice}>
                    <Text style={styles.connectingNoticeText}>
                      Getting your location and connecting to dispatch...
                    </Text>
                  </View>
                  <Button
                    title="Connecting..."
                    variant="primary"
                    loading={true}
                    disabled={true}
                    onPress={() => {}}
                    style={styles.dutyBtn}
                  />
                </View>
              ) : isState5Failure ? (
                // STATE 5: LOCATION FAILURE -> Show error and Retry button
                <View style={styles.dutyActionBlock}>
                  <View style={styles.failureBox}>
                    <Text style={styles.failureTitle}>Location Acquisition Failed</Text>
                    <Text style={styles.failureReason}>
                      Reason: {locationError || 'GPS signal could not be acquired.'}
                    </Text>
                  </View>

                  <View style={styles.failureBtnRow}>
                    <Button
                      title="TRY AGAIN"
                      variant="primary"
                      onPress={handleRetryPress}
                      style={styles.retryBtn}
                    />
                    {(trackingStatus === 'PERMISSION_DENIED' || trackingStatus === 'SERVICES_DISABLED') && (
                      <Button
                        title="Open Settings"
                        variant="secondary"
                        onPress={handleOpenSettings}
                        style={styles.settingsBtn}
                      />
                    )}
                  </View>
                </View>
              ) : (
                // STATE 2: VERIFIED + OFFLINE -> Show GO ONLINE
                <View style={styles.dutyActionBlock}>
                  <View style={styles.offlineNotice}>
                    <Text style={styles.offlineNoticeText}>
                      You're not receiving emergency requests.
                    </Text>
                  </View>
                  <Button
                    title="GO ONLINE"
                    variant="primary"
                    onPress={handleGoOnlinePress}
                    style={styles.goOnlineBtn}
                  />
                </View>
              )}
            </Card>

            {/* EMERGENCY: Active Emergency or Incoming Request Card */}
            <EmergencyRequestCard
              isVerified={isVerified}
              isOnline={isOnline}
              isAvailable={availability === 'AVAILABLE'}
              requestStatus={requestStatus}
              currentRequest={currentRequest}
              lastActionMessage={lastActionMessage}
              isCompleting={isCompleting}
              completionError={completionError}
              driverLocation={currentLocation}
              onClearCompletionError={clearCompletionError}
              onSimulateEmergency={simulateIncomingEmergency}
              onCompleteEmergency={completeEmergency}
              onOpenAlert={openAlert}
              onOpenTrackingMap={() => router.push('/(driver)/live-tracking')}
            />

            {/* LOCATION: Current GPS Status & Live Telemetry */}
            <LocationDisplayCard
              trackingStatus={trackingStatus}
              location={currentLocation}
              error={locationError}
            />

            {/* Development-Only Location Simulator */}
            <LocationSimulatorCard
              isSimulatorMode={isSimulatorMode}
              onToggleSimulator={toggleSimulatorMode}
              isOnline={isOnline}
            />

            {/* SECONDARY: Operational Authorization & Verification */}
            <Card elevated style={[styles.verificationCard, styles.cardVerified]}>
              <View style={styles.verificationHeader}>
                <Text style={styles.verificationTitle}>Operational Authorization</Text>
                <Badge label="VERIFIED ✓" variant="success" />
              </View>

              <View style={styles.unlockedBanner}>
                <Text style={styles.unlockedIcon}>✓</Text>
                <View style={styles.unlockedTextCol}>
                  <Text style={styles.unlockedTitle}>Operational Access Unlocked</Text>
                  <Text style={styles.unlockedSubtitle}>
                    All 6 documents verified. You are authorized to receive emergency dispatch requests.
                  </Text>
                </View>
              </View>

              <Button
                title={getVerificationActionLabel()}
                variant="secondary"
                onPress={() => router.push('/(driver)/verification')}
                style={styles.verificationBtn}
              />
            </Card>
          </>
        )}

        {/* SECONDARY: Active Driver Session Details */}
        {driverSession && (
          <Card elevated style={styles.sessionCard}>
            <Text style={styles.cardTitle}>Active Driver Session</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Driver Name:</Text>
              <Text style={styles.valueHighlight}>
                {driverSession.fullName || driverSession.displayName || driverSession.name || 'Emergency Responder'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Driver ID:</Text>
              <Text style={styles.valueHighlight}>{driverSession.driverId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mobile:</Text>
              <Text style={styles.value}>{driverSession.mobileNumber}</Text>
            </View>
            {driverSession.email ? (
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{driverSession.email}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Experience:</Text>
              <Text style={styles.value}>{driverSession.yearsOfExperience ?? 0} Years</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Authorization:</Text>
              <Text style={[styles.value, isVerified ? styles.textVerified : styles.textPending]}>
                {isVerified ? 'VERIFIED RESPONDER ✓' : 'PENDING ADMIN APPROVAL'}
              </Text>
            </View>
          </Card>
        )}

        {/* Sign Out */}
        <View style={styles.footer}>
          <Button
            title="Sign Out (Clear Session)"
            variant="secondary"
            onPress={handleSignOut}
          />
        </View>
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
  header: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  verificationCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  cardVerified: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  cardRejected: {
    borderColor: Colors.critical,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verificationTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  verificationDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successMuted,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  unlockedIcon: {
    fontSize: 20,
    color: Colors.success,
    fontWeight: 'bold',
  },
  unlockedTextCol: {
    flex: 1,
    gap: 2,
  },
  unlockedTitle: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
  unlockedSubtitle: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 11,
    lineHeight: 15,
  },
  lockedNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs,
    gap: 2,
  },
  lockedNoticeTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  lockedNoticeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  docCountRow: {
    marginVertical: 4,
  },
  docCountText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  verificationBtn: {
    marginTop: Spacing.xs,
  },
  lockedDutyCard: {
    marginVertical: Spacing.sm,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  lockedDutyText: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  dutyCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dutyCardOnline: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dutyCardTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  dutyCardSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusTile: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  tileLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tileValue: {
    ...Typography.title,
    fontSize: 15,
    fontWeight: '700',
  },
  textOnline: {
    color: Colors.success,
  },
  textOffline: {
    color: Colors.textMuted,
  },
  textAvailable: {
    color: Colors.success,
  },
  textBusy: {
    color: Colors.warning,
  },
  textUnavailable: {
    color: Colors.textMuted,
  },
  dutyActionBlock: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  goOnlineBtn: {
    backgroundColor: Colors.success,
  },
  dutyBtn: {
    width: '100%',
  },
  onlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  onlineDot: {
    color: Colors.success,
    fontSize: 12,
  },
  onlineNoticeText: {
    ...Typography.caption,
    color: Colors.success,
    fontSize: 11,
  },
  busyDot: {
    color: Colors.warning,
    fontSize: 12,
  },
  busyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  busyNoticeText: {
    ...Typography.caption,
    color: Colors.warning,
    fontSize: 11,
    flex: 1,
  },
  disabledOfflineBtn: {
    width: '100%',
    opacity: 0.5,
  },
  offlineNotice: {
    paddingVertical: 2,
    alignItems: 'center',
  },
  offlineNoticeText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  connectingNotice: {
    paddingVertical: 2,
    alignItems: 'center',
  },
  connectingNoticeText: {
    ...Typography.caption,
    color: Colors.warning,
    fontSize: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  failureBox: {
    backgroundColor: Colors.criticalMuted,
    borderLeftWidth: 3,
    borderLeftColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  failureTitle: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
  },
  failureReason: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 11,
    lineHeight: 15,
  },
  failureBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  retryBtn: {
    flex: 1,
  },
  settingsBtn: {
    flex: 1,
  },
  sessionCard: {
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    ...Typography.subtext,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  valueHighlight: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  textVerified: {
    color: Colors.success,
    fontWeight: '700',
  },
  textPending: {
    color: Colors.warning,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
});
