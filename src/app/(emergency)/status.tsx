/**
 * RapidRescue Emergency Processing & Status Screen (Phase 4)
 *
 * Requirements:
 * - Displays:
 *   🚨 EMERGENCY ACTIVE
 *   ✓ Location detected
 *   ✓ Front photo captured
 *   ✓ Rear photo captured
 *   Then: "Preparing ambulance request..."
 * - Patient does NOT press any manual button to dispatch
 * - Typed data model: EmergencyCaptureData (no `any`)
 * - Error handling for Camera/GPS/Network failure with safe emergency fallback message
 * - Safe cancellation
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/hooks/useLocation';
import { locationService } from '@/services/location.service';
import {
  emergencyService,
  DispatchOutcome,
} from '@/services/emergency.service';
import { PulseDot } from '@/components/common/PulseDot';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  EmergencyCaptureData,
  EmergencyRecord,
} from '@/types/emergency.types';

export default function EmergencyStatusScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useTheme();
  const params = useLocalSearchParams<{ frontPhotoUri?: string; rearPhotoUri?: string }>();

  // Photos passed from automated camera screen
  const frontPhotoUri = params.frontPhotoUri ?? null;
  const rearPhotoUri = params.rearPhotoUri ?? null;

  // GPS Location Hook
  const {
    isFetching: isFetchingLocation,
    location,
    address,
    error: locationError,
    errorMessage: locationErrorMessage,
    requestAndCapture: captureLocation,
  } = useLocation();

  // Dispatch state
  const [dispatchStatus, setDispatchStatus] = useState<
    'preparing' | 'sending' | 'dispatched' | 'failed'
  >('preparing');
  const [dispatchRecord, setDispatchRecord] = useState<EmergencyRecord | null>(null);
  const [dispatchErrorMessage, setDispatchErrorMessage] = useState<string | null>(null);

  // Guards to trigger auto-dispatch exactly once
  const dispatchAttempted = useRef(false);
  const isMounted = useRef(true);

  // 1. Kick off location if not already cached
  useEffect(() => {
    isMounted.current = true;
    const cached = emergencyService.getCachedLocation();

    if (!cached.location) {
      captureLocation();
    }

    return () => {
      isMounted.current = false;
    };
  }, [captureLocation]);

  // Read effective location (from cache or live hook)
  const cached = emergencyService.getCachedLocation();
  const effectiveLocation = cached.location ?? location;
  const effectiveAddress = cached.address ?? address;
  const locationResolved = effectiveLocation !== null || (!isFetchingLocation && locationError !== null);

  // 2. Trigger Automatic Dispatch once Location & Photos are ready
  const triggerAutoDispatch = useCallback(async () => {
    if (dispatchAttempted.current || !isMounted.current) return;
    dispatchAttempted.current = true;

    setDispatchStatus('sending');
    setDispatchErrorMessage(null);

    // 7. Typed emergency capture object (no `any`)
    const emergencyData: EmergencyCaptureData = {
      frontPhotoUri: frontPhotoUri ?? '',
      rearPhotoUri: rearPhotoUri ?? '',
      latitude: effectiveLocation?.latitude ?? 0,
      longitude: effectiveLocation?.longitude ?? 0,
      accuracy: effectiveLocation?.accuracy ?? null,
      timestamp: effectiveLocation?.timestamp ?? new Date().toISOString(),
      address: effectiveAddress?.formattedAddress,
    };

    const outcome: DispatchOutcome = await emergencyService.autoDispatchEmergency(emergencyData);

    if (!isMounted.current) return;

    if (outcome.success && outcome.emergencyRecord) {
      setDispatchRecord(outcome.emergencyRecord);
      setDispatchStatus('dispatched');
    } else {
      setDispatchStatus('failed');
      setDispatchErrorMessage(outcome.error ?? 'Emergency dispatch failed. Please retry.');
    }
  }, [frontPhotoUri, rearPhotoUri, effectiveLocation, effectiveAddress]);

  useEffect(() => {
    if (locationResolved && !dispatchAttempted.current) {
      triggerAutoDispatch();
    }
  }, [locationResolved, triggerAutoDispatch]);

  // Controlled Retry if dispatch failed
  const handleManualRetry = () => {
    dispatchAttempted.current = false;
    triggerAutoDispatch();
  };

  // Safe cancellation
  const handleCancelEmergency = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel this active emergency request?',
      [
        { text: 'No, Keep Active', style: 'cancel' },
        {
          text: 'Yes, Cancel Emergency',
          style: 'destructive',
          onPress: async () => {
            await emergencyService.cancelEmergency('User cancelled');
            router.replace('/(patient)/home');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Emergency Active Header */}
      <View style={[styles.headerBanner, { backgroundColor: '#DC2626' }]}>
        <View style={styles.headerLeft}>
          <PulseDot color="#FFFFFF" size={10} />
          <Text style={styles.headerTitle}>EMERGENCY ACTIVE</Text>
        </View>
        <TouchableOpacity
          style={styles.cancelHeaderBtn}
          onPress={handleCancelEmergency}
        >
          <Text style={styles.cancelHeaderText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Status Announcement */}
        <Text style={[styles.headline, { color: colors.text }]}>
          {dispatchStatus === 'dispatched'
            ? 'Ambulance Request Dispatched'
            : 'Preparing ambulance request...'}
        </Text>
        <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
          {dispatchStatus === 'dispatched'
            ? 'Emergency response coordinators have received your location and photos.'
            : 'Gathering emergency data automatically. No action needed.'}
        </Text>

        {/* Status Checklist Cards */}
        <View style={styles.stepsContainer}>
          {/* STEP 1: GPS Location */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.stepIconWrapper}>
              {isFetchingLocation && !effectiveLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : effectiveLocation ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="warning" size={22} color={colors.amber} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {isFetchingLocation && !effectiveLocation
                  ? 'Detecting GPS location…'
                  : effectiveLocation
                  ? 'Location detected'
                  : 'GPS location unavailable'}
              </Text>
              {effectiveLocation && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  {locationService.formatCoordinates(effectiveLocation.latitude, effectiveLocation.longitude)} (
                  {locationService.formatAccuracy(effectiveLocation.accuracy)})
                </Text>
              )}
              {effectiveAddress && (
                <Text style={[styles.stepDetailSub, { color: colors.textMuted }]}>
                  {effectiveAddress.formattedAddress}
                </Text>
              )}
              {locationErrorMessage && !effectiveLocation && (
                <Text style={[styles.stepWarning, { color: colors.primary }]}>
                  {locationErrorMessage}
                </Text>
              )}
            </View>
          </View>

          {/* STEP 2: Front Photo */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.stepIconWrapper}>
              {frontPhotoUri ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="warning" size={22} color={colors.amber} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {frontPhotoUri ? 'Front photo captured' : 'Front photo unavailable'}
              </Text>
              {frontPhotoUri && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  Patient emergency portrait secured
                </Text>
              )}
            </View>
            {frontPhotoUri && (
              <Image
                source={{ uri: frontPhotoUri }}
                style={[styles.thumbnail, { borderRadius: borderRadius.sm }]}
              />
            )}
          </View>

          {/* STEP 3: Rear Photo */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.stepIconWrapper}>
              {rearPhotoUri ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="warning" size={22} color={colors.amber} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {rearPhotoUri ? 'Rear photo captured' : 'Rear photo unavailable'}
              </Text>
              {rearPhotoUri && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  Surroundings evidence secured
                </Text>
              )}
            </View>
            {rearPhotoUri && (
              <Image
                source={{ uri: rearPhotoUri }}
                style={[styles.thumbnail, { borderRadius: borderRadius.sm }]}
              />
            )}
          </View>

          {/* STEP 4: Ambulance Request Status */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <View style={styles.stepIconWrapper}>
              {dispatchStatus === 'sending' ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : dispatchStatus === 'dispatched' ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : dispatchStatus === 'failed' ? (
                <Ionicons name="alert-circle" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {dispatchStatus === 'sending'
                  ? 'Preparing ambulance request…'
                  : dispatchStatus === 'dispatched'
                  ? 'Ambulance request sent'
                  : dispatchStatus === 'failed'
                  ? 'Dispatch request failed'
                  : 'Awaiting evidence compilation…'}
              </Text>
              {dispatchStatus === 'dispatched' && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  Emergency ID: {dispatchRecord?.id}
                </Text>
              )}
              {dispatchErrorMessage && (
                <Text style={[styles.stepWarning, { color: colors.primary }]}>
                  {dispatchErrorMessage}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Live Search Card (Visible after dispatch) */}
        {dispatchStatus === 'dispatched' && (
          <View
            style={[
              styles.dispatchActiveCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.dispatchRow}>
              <PulseDot color={colors.primary} size={10} />
              <Text style={[styles.dispatchTitle, { color: colors.text }]}>
                Dispatching nearest ambulance…
              </Text>
            </View>
            <Text style={[styles.dispatchSubtitle, { color: colors.textSecondary }]}>
              RapidRescue dispatch system is processing your emergency ticket and notifying available medical units.
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge label="HIGH PRIORITY" variant="emergency" />
              <StatusBadge label="GPS TRANSMITTING" variant="success" />
            </View>
          </View>
        )}

        {/* Emergency Fallback Message if Location or Camera missing */}
        {(!effectiveLocation || !frontPhotoUri || !rearPhotoUri) && (
          <View
            style={[
              styles.fallbackCard,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.cardBorder,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
            <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
              Emergency Fallback: Dispatch is transmitting available device and telemetry data to ensure emergency response is not delayed.
            </Text>
          </View>
        )}

        {/* Failed Dispatch Retry */}
        {dispatchStatus === 'failed' && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleManualRetry}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>RETRY DISPATCH</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Safety Notice Footer */}
      <View
        style={[
          styles.footerNotice,
          { backgroundColor: colors.backgroundElement, borderTopColor: colors.cardBorder },
        ]}
      >
        <Ionicons name="shield-checkmark" size={16} color={colors.success} />
        <Text style={[styles.footerNoticeText, { color: colors.textSecondary }]}>
          Your location and emergency photos are encrypted and transmitted directly to responders.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cancelHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  subheadline: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  stepIconWrapper: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  stepDetailSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stepWarning: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  thumbnail: {
    width: 44,
    height: 44,
  },
  dispatchActiveCard: {
    padding: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  dispatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dispatchTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dispatchSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fallbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  fallbackText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  footerNoticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
