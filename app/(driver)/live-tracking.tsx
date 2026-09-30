import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import {
  ScreenWrapper,
  Badge,
  Card,
  Button,
  LiveTrackingMapView,
} from '../../src/components';
import { useEmergency } from '../../src/hooks';
import { useLocation } from '../../src/hooks';
import { resolveBackendMediaUrl } from '../../src/config/apiConfig';

export default function LiveTrackingScreen() {
  const router = useRouter();
  const {
    currentRequest,
    patientLocation,
    requestStatus,
    isCompleting,
    completionError,
    completeEmergency,
    clearCompletionError,
  } = useEmergency();

  const { currentLocation } = useLocation();

  // Route progression state (for interactive dev demo & live tracking)
  const [progress, setProgress] = useState<number>(15);
  const [trafficDelay, setTrafficDelay] = useState<number>(0);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // If no active emergency, provide fallback demonstration data or redirect option
  const hasActiveMission = Boolean(currentRequest);

  // Fallback coordinates (Central Bangalore Medical Sector)
  const defaultDriverLat = currentLocation?.latitude || 12.9716;
  const defaultDriverLng = currentLocation?.longitude || 77.5946;
  const defaultPatientLat =
    patientLocation?.latitude || currentRequest?.pickupLatitude || 12.9815;
  const defaultPatientLng =
    patientLocation?.longitude || currentRequest?.pickupLongitude || 77.6045;

  const [simulatedPatientLat, setSimulatedPatientLat] = useState<number>(defaultPatientLat);
  const [simulatedPatientLng, setSimulatedPatientLng] = useState<number>(defaultPatientLng);

  useEffect(() => {
    if (patientLocation) {
      setSimulatedPatientLat(patientLocation.latitude);
      setSimulatedPatientLng(patientLocation.longitude);
    } else if (currentRequest) {
      setSimulatedPatientLat(currentRequest.pickupLatitude);
      setSimulatedPatientLng(currentRequest.pickupLongitude);
    }
  }, [patientLocation, currentRequest]);

  // Display fields
  const emergencyId = currentRequest?.emergencyId || currentRequest?.id || 'EMG-DEMO-2026';
  const priority = currentRequest?.priority || 'CRITICAL';
  const emergencyType = currentRequest?.emergencyType || 'MEDICAL EMERGENCY';
  const patientName = currentRequest?.patient?.name || currentRequest?.patientName || 'Ananya Sharma';
  const patientPhone = currentRequest?.patient?.phone || currentRequest?.patientPhone || '+91 98450 12345';
  const patientAddress =
    currentRequest?.pickupAddress || '124 5th Cross Road, Indira Nagar Ward 4';

  const rawPhoto = currentRequest?.patient?.photoUrl || currentRequest?.patientPhotoUrl;
  const patientPhotoUri = resolveBackendMediaUrl(rawPhoto);

  const baseDistance = currentRequest?.distanceKm || 3.4;
  const baseEta = (currentRequest?.etaMinutes || 7) + trafficDelay;

  // Feedback toast timer
  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Dev Demo Simulators
  const handleSimulateStep = () => {
    setProgress((prev) => {
      const next = Math.min(100, prev + 20);
      showToast(
        next >= 98
          ? '🏁 Ambulance arrived at emergency pickup location!'
          : `🚗 Advanced along route: ${Math.round(next)}% complete`
      );
      return next;
    });
  };

  const handleSimulateArrival = () => {
    setProgress(100);
    showToast('🏁 Rapid Arrival: Ambulance has arrived at pickup scene!');
  };

  const handleSimulatePatientShift = () => {
    setSimulatedPatientLat((prev) => prev + 0.0018);
    setSimulatedPatientLng((prev) => prev + 0.0012);
    showToast('📍 PATIENT_LOCATION event received: Pickup position updated!');
  };

  const handleSimulateTraffic = () => {
    setTrafficDelay((prev) => {
      const next = prev === 0 ? 4 : prev === 4 ? 8 : 0;
      showToast(
        next === 0
          ? '🟢 Traffic cleared: ETA restored to normal'
          : `🚦 Traffic congestion simulated (+${next} min ETA delay)`
      );
      return next;
    });
  };

  const handleResetRoute = () => {
    setProgress(10);
    setTrafficDelay(0);
    showToast('🔄 Demo route reset to starting position');
  };

  const handleCallPatient = () => {
    if (patientPhone) {
      Linking.openURL(`tel:${patientPhone.replace(/\s+/g, '')}`).catch(() => {
        Alert.alert('Phone Call', `Dialing patient at: ${patientPhone}`);
      });
    }
  };

  const handleCompleteEmergency = async () => {
    Alert.alert(
      'Complete Emergency Mission',
      'Confirm emergency incident completion? This will notify central dispatch and release you to AVAILABLE status.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Emergency',
          style: 'default',
          onPress: async () => {
            const success = await completeEmergency();
            if (success) {
              Alert.alert(
                'Mission Completed ✓',
                'Emergency successfully resolved. You are now back in AVAILABLE status.',
                [
                  {
                    text: 'Return to Dashboard',
                    onPress: () => router.replace('/(driver)/dashboard'),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.topNavBar}>
          <Pressable
            onPress={() => router.replace('/(driver)/dashboard')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Driver Dashboard"
          >
            <Text style={styles.backButtonText}>← Dashboard</Text>
          </Pressable>

          <View style={styles.topBadgesRow}>
            <Badge label="MISSION EN ROUTE" variant="critical" />
            <Badge label={priority} variant={priority === 'CRITICAL' ? 'critical' : 'warning'} />
          </View>
        </View>

        {/* Screen Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Live Tracking & Navigation</Text>
          <Text style={styles.screenSubtitle}>
            Emergency Incident #{emergencyId} • Real-time Dispatch Route
          </Text>
        </View>

        {/* Feedback Toast */}
        {feedbackToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastText}>{feedbackToast}</Text>
          </View>
        )}

        {/* Completion Error Alert */}
        {completionError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {completionError}</Text>
            {clearCompletionError && (
              <Pressable onPress={clearCompletionError}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ================= INTERACTIVE LIVE TRACKING MAP ================= */}
        <LiveTrackingMapView
          driverLat={defaultDriverLat}
          driverLng={defaultDriverLng}
          driverHeading={currentLocation?.heading ?? 55}
          driverSpeed={progress >= 98 ? 0 : (currentLocation?.speed ? Math.round(currentLocation.speed * 3.6) : 48)}
          patientLat={simulatedPatientLat}
          patientLng={simulatedPatientLng}
          patientName={patientName}
          patientAddress={patientAddress}
          emergencyType={emergencyType}
          priority={priority}
          routeProgress={progress}
          etaMinutes={baseEta}
          distanceKm={baseDistance}
          onSimulateStep={handleSimulateStep}
          onSimulateArrival={handleSimulateArrival}
          onSimulatePatientShift={handleSimulatePatientShift}
          onSimulateTraffic={handleSimulateTraffic}
          onResetRoute={handleResetRoute}
        />

        {/* Patient Information & Quick Call Card */}
        <Card elevated style={styles.patientInfoCard}>
          <View style={styles.patientHeaderRow}>
            <View style={styles.patientPhotoContainer}>
              {patientPhotoUri ? (
                <Image source={{ uri: patientPhotoUri }} style={styles.patientPhoto} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {patientName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.patientDetailsCol}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientPhone}>{patientPhone}</Text>
              <Text style={styles.emergencyCategoryText}>Triage: {emergencyType}</Text>
            </View>

            <Pressable
              style={styles.callPatientBtn}
              onPress={handleCallPatient}
              accessibilityRole="button"
              accessibilityLabel="Call patient"
            >
              <Text style={styles.callPatientIcon}>📞</Text>
              <Text style={styles.callPatientText}>Call</Text>
            </Pressable>
          </View>

          <View style={styles.pickupLocationBlock}>
            <Text style={styles.pickupLabel}>VERIFIED PICKUP ADDRESS:</Text>
            <Text style={styles.pickupAddressText}>📍 {patientAddress}</Text>
          </View>
        </Card>

        {/* Incident Resolution Action Block */}
        <View style={styles.actionButtonsCol}>
          <Button
            title={isCompleting ? 'Completing Emergency...' : '✓ COMPLETE EMERGENCY INCIDENT'}
            variant="primary"
            loading={isCompleting}
            disabled={isCompleting}
            onPress={handleCompleteEmergency}
            style={styles.completeBtn}
          />

          <Button
            title="Return to Dashboard"
            variant="secondary"
            onPress={() => router.replace('/(driver)/dashboard')}
            disabled={isCompleting}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  screenHeader: {
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toastBanner: {
    backgroundColor: '#0F172A',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  toastText: {
    ...Typography.caption,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: Colors.criticalMuted,
    borderColor: Colors.critical,
    borderWidth: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '700',
    flex: 1,
  },
  dismissText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
    marginLeft: Spacing.sm,
  },

  // Patient Info Card
  patientInfoCard: {
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  patientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientPhotoContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceHighlight,
    marginRight: Spacing.base,
  },
  patientPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patientDetailsCol: {
    flex: 1,
  },
  patientName: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text,
  },
  patientPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emergencyCategoryText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  callPatientBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  callPatientIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  callPatientText: {
    ...Typography.caption,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pickupLocationBlock: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  pickupAddressText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },

  // Action Buttons
  actionButtonsCol: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  completeBtn: {
    backgroundColor: Colors.success,
  },
});
