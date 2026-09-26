/**
 * RapidRescue Automated Emergency Camera Screen
 *
 * Fully automated dual-photo sequential capture:
 * FRONT CAMERA -> REAR CAMERA
 *
 * State Machine:
 * IDLE -> INITIALIZING_FRONT -> FRONT_READY -> CAPTURING_FRONT -> FRONT_CAPTURED
 * -> INITIALIZING_REAR -> REAR_READY -> CAPTURING_REAR -> REAR_CAPTURED -> COMPLETE
 *
 * Rules:
 * - Patient presses SOS once (no TAKE PHOTO button, no confirmation button, no manual switch)
 * - Captures exactly one front photo and one rear photo
 * - Only captures after camera explicitly reports READY via onCameraReady event
 * - Safe 300ms sensor stabilization buffer (no 5-10s delays)
 * - Prevents duplicate captures
 * - Single persistent component mount
 * - Controlled retry on failure (no infinite loop)
 * - Temporary debug logs matching requirements exactly:
 *   FRONT_CAMERA_READY
 *   FRONT_CAPTURE_STARTED
 *   FRONT_CAPTURE_SUCCESS
 *   REAR_CAMERA_READY
 *   REAR_CAPTURE_STARTED
 *   REAR_CAPTURE_SUCCESS
 *   CAMERA_FLOW_COMPLETE
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { cameraService, getCameraErrorMessage } from '@/services/camera.service';
import { CameraAutomationState } from '@/types/camera.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HARDWARE_CAPTURE_TIMEOUT_MS = 6000;
const SENSOR_STABILIZATION_DELAY_MS = 350;

export default function EmergencyCameraScreen() {
  const router = useRouter();
  const { colors, borderRadius } = useTheme();

  // State Machine
  const [state, setState] = useState<CameraAutomationState>('IDLE');
  const [facing, setFacing] = useState<CameraType>('front');
  const [frontPhotoUri, setFrontPhotoUri] = useState<string | null>(null);
  const [rearPhotoUri, setRearPhotoUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Native Camera & URI Refs
  const cameraRef = useRef<CameraView | null>(null);
  const frontPhotoUriRef = useRef<string | null>(null);
  const rearPhotoUriRef = useRef<string | null>(null);

  // Guards
  const isCapturingRef = useRef(false);
  const isMountedRef = useRef(true);

  // 1. Mount & Initialize Front Camera
  useEffect(() => {
    isMountedRef.current = true;

    async function initCamera() {
      setState('INITIALIZING_FRONT');
      try {
        const perm = await cameraService.requestPermission();
        if (!isMountedRef.current) return;

        if (perm !== 'granted') {
          setState('ERROR');
          setErrorMessage(getCameraErrorMessage('PERMISSION_DENIED'));
          return;
        }
        // Permission granted, facing is 'front', awaiting onCameraReady
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setState('ERROR');
        setErrorMessage(
          'Failed to initialize camera: ' + ((err as Error).message ?? 'Unknown error')
        );
      }
    }

    initCamera();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2. Camera Ready Callback from <CameraView onCameraReady={...} />
  const handleCameraReady = useCallback(() => {
    if (!isMountedRef.current) return;

    if (state === 'INITIALIZING_FRONT') {
      console.log('FRONT_CAMERA_READY');
      setState('FRONT_READY');
    } else if (state === 'INITIALIZING_REAR') {
      console.log('REAR_CAMERA_READY');
      setState('REAR_READY');
    }
  }, [state]);

  // 3. FRONT_READY -> Wait 350ms stabilization -> CAPTURING_FRONT
  useEffect(() => {
    if (state !== 'FRONT_READY') return;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setState('CAPTURING_FRONT');
    }, SENSOR_STABILIZATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [state]);

  // 4. Execute Front Capture when in CAPTURING_FRONT state
  useEffect(() => {
    if (state !== 'CAPTURING_FRONT') return;
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    console.log('FRONT_CAPTURE_STARTED');
    let isEffectActive = true;

    async function doFrontCapture() {
      try {
        if (!cameraRef.current) {
          throw new Error('Camera reference is not available');
        }

        const capturePromise = cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Front camera capture timed out')),
            HARDWARE_CAPTURE_TIMEOUT_MS
          )
        );

        const photo = await Promise.race([capturePromise, timeoutPromise]);

        if (!isEffectActive || !isMountedRef.current) return;

        if (!photo || !photo.uri) {
          throw new Error('Camera returned empty photo data');
        }

        frontPhotoUriRef.current = photo.uri;
        setFrontPhotoUri(photo.uri);
        console.log('FRONT_CAPTURE_SUCCESS');
        isCapturingRef.current = false;

        // Transition to FRONT_CAPTURED
        setState('FRONT_CAPTURED');
      } catch (err: unknown) {
        if (!isEffectActive || !isMountedRef.current) return;
        isCapturingRef.current = false;
        setState('ERROR');
        setErrorMessage(
          'Front photo capture failed: ' + ((err as Error).message ?? 'Unknown error')
        );
      }
    }

    doFrontCapture();

    return () => {
      isEffectActive = false;
    };
  }, [state]);

  // 5. FRONT_CAPTURED -> Switch to Rear Camera
  useEffect(() => {
    if (state === 'FRONT_CAPTURED') {
      setFacing('back');
      setState('INITIALIZING_REAR');
    }
  }, [state]);

  // 6. REAR_READY -> Wait 350ms stabilization -> CAPTURING_REAR
  useEffect(() => {
    if (state !== 'REAR_READY') return;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setState('CAPTURING_REAR');
    }, SENSOR_STABILIZATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [state]);

  // 7. Execute Rear Capture when in CAPTURING_REAR state
  useEffect(() => {
    if (state !== 'CAPTURING_REAR') return;
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    console.log('REAR_CAPTURE_STARTED');
    let isEffectActive = true;

    async function doRearCapture() {
      try {
        if (!cameraRef.current) {
          throw new Error('Camera reference is not available');
        }

        const capturePromise = cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Rear camera capture timed out')),
            HARDWARE_CAPTURE_TIMEOUT_MS
          )
        );

        const photo = await Promise.race([capturePromise, timeoutPromise]);

        if (!isEffectActive || !isMountedRef.current) return;

        if (!photo || !photo.uri) {
          throw new Error('Camera returned empty photo data');
        }

        rearPhotoUriRef.current = photo.uri;
        setRearPhotoUri(photo.uri);
        console.log('REAR_CAPTURE_SUCCESS');
        isCapturingRef.current = false;

        // Transition to REAR_CAPTURED
        setState('REAR_CAPTURED');
      } catch (err: unknown) {
        if (!isEffectActive || !isMountedRef.current) return;
        isCapturingRef.current = false;
        setState('ERROR');
        setErrorMessage(
          'Rear photo capture failed: ' + ((err as Error).message ?? 'Unknown error')
        );
      }
    }

    doRearCapture();

    return () => {
      isEffectActive = false;
    };
  }, [state]);

  // 8. REAR_CAPTURED -> CAMERA_FLOW_COMPLETE -> Continue to status screen
  useEffect(() => {
    if (state === 'REAR_CAPTURED') {
      console.log('CAMERA_FLOW_COMPLETE');
      setState('COMPLETE');

      router.replace({
        pathname: '/(emergency)/status',
        params: {
          frontPhotoUri: frontPhotoUriRef.current ?? undefined,
          rearPhotoUri: rearPhotoUriRef.current ?? undefined,
        },
      });
    }
  }, [state, router]);

  // Controlled Retry handler (no infinite loop)
  const handleControlledRetry = () => {
    isCapturingRef.current = false;
    setErrorMessage(null);
    frontPhotoUriRef.current = null;
    rearPhotoUriRef.current = null;
    setFrontPhotoUri(null);
    setRearPhotoUri(null);
    setFacing('front');
    setState('INITIALIZING_FRONT');
  };

  const handleCancel = () => {
    router.replace('/(patient)/home');
  };

  // Status message lookup for overlay
  const getStatusLabel = () => {
    switch (state) {
      case 'INITIALIZING_FRONT':
        return 'Starting Front Camera…';
      case 'FRONT_READY':
      case 'CAPTURING_FRONT':
        return 'Capturing Front Photo Automatically…';
      case 'FRONT_CAPTURED':
      case 'INITIALIZING_REAR':
        return 'Front Photo Secured ✓ • Starting Rear Camera…';
      case 'REAR_READY':
      case 'CAPTURING_REAR':
        return 'Capturing Rear Photo Automatically…';
      case 'REAR_CAPTURED':
      case 'COMPLETE':
        return 'Both Photos Secured ✓ • Dispatching…';
      case 'ERROR':
        return 'Camera Capture Error';
      default:
        return 'Preparing Emergency Camera…';
    }
  };

  return (
    <View style={styles.fullScreen}>
      {/* Persistent Single Mount CameraView */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
        onCameraReady={handleCameraReady}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              accessibilityLabel="Cancel emergency"
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.topBarCenter}>
              <Text style={styles.cameraTitle}>Automatic Emergency Capture</Text>
              <Text style={styles.cameraSubtitle}>
                {facing === 'front' ? 'Camera 1 of 2: Front' : 'Camera 2 of 2: Rear'}
              </Text>
            </View>

            <View style={styles.topBarRight} />
          </View>
        </SafeAreaView>

        {/* Center Frame Guide */}
        <View style={styles.guideFrameContainer}>
          <View
            style={[
              styles.guideFrame,
              {
                borderColor:
                  state === 'CAPTURING_FRONT' || state === 'CAPTURING_REAR'
                    ? '#DC2626'
                    : 'rgba(255,255,255,0.7)',
              },
            ]}
          />
          <Text style={styles.guideText}>
            {facing === 'front'
              ? 'Hold device steady facing you'
              : 'Hold device steady facing surroundings'}
          </Text>
        </View>

        {/* Error Banner & Controlled Retry */}
        {state === 'ERROR' && errorMessage && (
          <View style={styles.errorContainer}>
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={20} color="#FFFFFF" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={[styles.retryBtn, { borderRadius: borderRadius.md }]}
              onPress={handleControlledRetry}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>RETRY CAPTURE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Automated Progress Status (No manual shutter buttons) */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <View style={styles.statusPill}>
            {state !== 'ERROR' && (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.statusPillText}>{getStatusLabel()}</Text>
          </View>

          <View style={styles.stepIndicators}>
            <View
              style={[
                styles.stepDot,
                frontPhotoUri ? styles.stepDotDone : styles.stepDotPending,
              ]}
            >
              <Ionicons
                name={frontPhotoUri ? 'checkmark' : 'ellipse'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.stepDotText}>1. FRONT</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.5)" />
            <View
              style={[
                styles.stepDot,
                rearPhotoUri ? styles.stepDotDone : styles.stepDotPending,
              ]}
            >
              <Ionicons
                name={rearPhotoUri ? 'checkmark' : 'ellipse'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.stepDotText}>2. REAR</Text>
            </View>
          </View>

          <Text style={styles.subtextNotice}>
            Automatic evidence securing • No manual button press required
          </Text>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cancelButton: {
    padding: 8,
  },
  topBarCenter: {
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cameraSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  topBarRight: {
    width: 44,
  },
  guideFrameContainer: {
    alignItems: 'center',
    marginTop: -SCREEN_HEIGHT * 0.04,
  },
  guideFrame: {
    width: 240,
    height: 300,
    borderWidth: 2.5,
    borderRadius: 18,
    borderStyle: 'dashed',
  },
  guideText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  errorContainer: {
    marginHorizontal: 20,
    gap: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(220,38,38,0.9)',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#DC2626',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingTop: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(220,38,38,0.85)',
    marginBottom: 14,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepDotDone: {
    backgroundColor: 'rgba(5, 150, 105, 0.8)',
  },
  stepDotPending: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  subtextNotice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
  },
});
