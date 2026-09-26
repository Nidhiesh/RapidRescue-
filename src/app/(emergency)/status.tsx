/**
 * RapidRescue Automatic Emergency Status Screen
 *
 * Implements the single-tap automated emergency lifecycle:
 * SOS Tapped -> Auto GPS + Auto Front Photo + Auto Rear Photo -> Auto Dispatch -> Live Status
 *
 * Zero manual confirmations. Zero manual shutter presses.
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
import { CameraView } from 'expo-camera';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/hooks/useLocation';
import { useAutoEmergencyCapture } from '@/hooks/useAutoEmergencyCapture';
import { locationService } from '@/services/location.service';
import {
  emergencyService,
  EmergencyEvidencePayload,
  DispatchOutcome,
} from '@/services/emergency.service';
import { PulseDot } from '@/components/common/PulseDot';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmergencyRecord } from '@/types/emergency.types';

export default function EmergencyStatusScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useTheme();
  const params = useLocalSearchParams<{ frontPhotoUri?: string; rearPhotoUri?: string }>();

  const passedFrontPhoto = params.frontPhotoUri
    ? {
        uri: params.frontPhotoUri,
        timestamp: new Date().toISOString(),
        facing: 'front' as const,
      }
    : null;

  const passedRearPhoto = params.rearPhotoUri
    ? {
        uri: params.rearPhotoUri,
        timestamp: new Date().toISOString(),
        facing: 'back' as const,
      }
    : null;

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
    'gathering' | 'sending' | 'dispatched' | 'failed'
  >('gathering');
  const [dispatchRecord, setDispatchRecord] = useState<EmergencyRecord | null>(null);
  const [dispatchErrorMessage, setDispatchErrorMessage] = useState<string | null>(null);

  // Guards to trigger auto-dispatch exactly once
  const dispatchAttempted = useRef(false);
  const isMounted = useRef(true);

  // Camera Hook (fallback only if photos were not passed via route)
  const {
    cameraRef,
    facing,
    stage: cameraStage,
    permissionStatus: cameraPermission,
    frontPhoto,
    rearPhoto,
    cameraWarning,
    isComplete: isCameraComplete,
    onCameraReady,
    startAutoCapture,
  } = useAutoEmergencyCapture();

  const effectiveFrontPhoto = passedFrontPhoto ?? frontPhoto;
  const effectiveRearPhoto = passedRearPhoto ?? rearPhoto;
  const cameraResolved = passedFrontPhoto && passedRearPhoto ? true : isCameraComplete;

  // 1. Kick off GPS (and camera fallback only if no photos provided)
  useEffect(() => {
    isMounted.current = true;
    captureLocation();

    if (!passedFrontPhoto || !passedRearPhoto) {
      startAutoCapture();
    }

    return () => {
      isMounted.current = false;
    };
  }, [passedFrontPhoto, passedRearPhoto, startAutoCapture, captureLocation]);

  // 2. Trigger Automatic Dispatch once Location & Camera stages have resolved
  const locationResolved = !isFetchingLocation;

  const triggerAutoDispatch = useCallback(async () => {
    if (dispatchAttempted.current || !isMounted.current) return;
    dispatchAttempted.current = true;

    setDispatchStatus('sending');
    setDispatchErrorMessage(null);

    const evidence: EmergencyEvidencePayload = {
      frontPhoto: effectiveFrontPhoto,
      rearPhoto: effectiveRearPhoto,
      location,
      address,
    };

    const outcome: DispatchOutcome = await emergencyService.autoDispatchEmergency(evidence);

    if (!isMounted.current) return;

    if (outcome.success && outcome.emergencyRecord) {
      setDispatchRecord(outcome.emergencyRecord);
      setDispatchStatus('dispatched');
    } else {
      setDispatchStatus('failed');
      setDispatchErrorMessage(outcome.error ?? 'Emergency dispatch failed. Please retry.');
    }
  }, [effectiveFrontPhoto, effectiveRearPhoto, location, address]);

  useEffect(() => {
    if (locationResolved && cameraResolved && !dispatchAttempted.current) {
      triggerAutoDispatch();
    }
  }, [locationResolved, cameraResolved, triggerAutoDispatch]);

  // Manual retry only if dispatch failed
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
        <Text style={[styles.headline, { color: colors.text }]}>
          {dispatchStatus === 'dispatched'
            ? 'Ambulance Dispatched'
            : 'Capturing Emergency Information…'}
        </Text>
        <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
          {dispatchStatus === 'dispatched'
            ? 'A medical response team is being allocated to your location.'
            : 'Evidence and GPS coordinates are being gathered automatically.'}
        </Text>

        {/* Live Camera Viewfinder (Only if photos were not passed from camera screen) */}
        {!passedFrontPhoto && !isCameraComplete && (
          <View
            style={[
              styles.cameraFrame,
              { backgroundColor: '#000000', borderRadius: borderRadius.md },
            ]}
          >
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mode="picture"
              onCameraReady={onCameraReady}
            />
            <View style={styles.cameraOverlayBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>
                Securing {facing === 'front' ? 'Front' : 'Rear'} Photo Evidence…
              </Text>
            </View>
          </View>
        )}

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
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : location ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="warning" size={22} color={colors.amber} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {isFetchingLocation
                  ? 'Detecting GPS location…'
                  : location
                  ? 'Location detected'
                  : 'Location access unavailable'}
              </Text>
              {location && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  {locationService.formatCoordinates(location.latitude, location.longitude)} (
                  {locationService.formatAccuracy(location.accuracy)})
                </Text>
              )}
              {address && (
                <Text style={[styles.stepDetailSub, { color: colors.textMuted }]}>
                  {address.formattedAddress}
                </Text>
              )}
              {locationErrorMessage && (
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
              {effectiveFrontPhoto ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : cameraStage === 'front_preparing' || cameraStage === 'front_capturing' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : cameraPermission === 'denied' || isCameraComplete ? (
                <Ionicons name="warning" size={22} color={colors.amber} />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {effectiveFrontPhoto
                  ? 'Front photo captured'
                  : cameraStage === 'front_preparing' || cameraStage === 'front_capturing'
                  ? 'Capturing front photo…'
                  : cameraPermission === 'denied'
                  ? 'Front camera permission denied'
                  : 'Awaiting front camera…'}
              </Text>
              {effectiveFrontPhoto && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  Patient emergency portrait secured
                </Text>
              )}
            </View>
            {effectiveFrontPhoto && (
              <Image
                source={{ uri: effectiveFrontPhoto.uri }}
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
              {effectiveRearPhoto ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : cameraStage === 'rear_preparing' || cameraStage === 'rear_capturing' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : cameraPermission === 'denied' || isCameraComplete ? (
                <Ionicons name="warning" size={22} color={colors.amber} />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {effectiveRearPhoto
                  ? 'Rear photo captured'
                  : cameraStage === 'rear_preparing' || cameraStage === 'rear_capturing'
                  ? 'Capturing rear photo…'
                  : cameraPermission === 'denied'
                  ? 'Rear camera permission denied'
                  : 'Awaiting rear camera…'}
              </Text>
              {effectiveRearPhoto && (
                <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                  Surroundings evidence secured
                </Text>
              )}
            </View>
            {effectiveRearPhoto && (
              <Image
                source={{ uri: effectiveRearPhoto.uri }}
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
                  ? 'Sending emergency request…'
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
                Searching for nearest ambulance…
              </Text>
            </View>
            <Text style={[styles.dispatchSubtitle, { color: colors.textSecondary }]}>
              Dispatch system is locating the nearest unit and calculating optimal route.
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge label="HIGH PRIORITY" variant="emergency" />
              <StatusBadge label="GPS BROADCASTING" variant="success" />
            </View>
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
  cameraFrame: {
    width: '100%',
    height: 140,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  cameraOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cameraOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
