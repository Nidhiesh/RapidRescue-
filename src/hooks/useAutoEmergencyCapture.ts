/**
 * RapidRescue useAutoEmergencyCapture Hook
 *
 * Implements completely automated sequential camera capture:
 * 1. Checks/Requests camera permission automatically
 * 2. Mounts FRONT camera -> auto-captures 1 photo (no manual shutter)
 *    -> on failure: automatically retries once
 * 3. Switches to REAR camera -> auto-captures 1 photo (no manual shutter)
 *    -> on failure: automatically retries once
 * 4. Stores captured URIs internally
 * 5. If camera permission denied: notifies safely and allows emergency flow to continue
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraView, CameraType } from 'expo-camera';
import {
  CameraPermissionStatus,
  CameraServiceResult,
  AutoCaptureStage,
  AutoCapturedPhotos,
} from '@/types/camera.types';
import { cameraService } from '@/services/camera.service';

export interface UseAutoEmergencyCaptureReturn {
  cameraRef: React.RefObject<CameraView | null>;
  facing: CameraType;
  stage: AutoCaptureStage;
  permissionStatus: CameraPermissionStatus;
  frontPhoto: CameraServiceResult | null;
  rearPhoto: CameraServiceResult | null;
  cameraWarning: string | null;
  isComplete: boolean;
  onCameraReady: () => void;
  startAutoCapture: () => void;
  photos: AutoCapturedPhotos;
}

export function useAutoEmergencyCapture(
  onComplete?: (photos: AutoCapturedPhotos) => void
): UseAutoEmergencyCaptureReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [stage, setStage] = useState<AutoCaptureStage>('idle');
  const [permissionStatus, setPermissionStatus] =
    useState<CameraPermissionStatus>('undetermined');
  const [frontPhoto, setFrontPhoto] = useState<CameraServiceResult | null>(null);
  const [rearPhoto, setRearPhoto] = useState<CameraServiceResult | null>(null);
  const [cameraWarning, setCameraWarning] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Guards to avoid double-triggers
  const captureInProgress = useRef(false);
  const frontRetryCount = useRef(0);
  const rearRetryCount = useRef(0);
  const hasStarted = useRef(false);

  const startAutoCapture = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    setStage('requesting_permission');
    try {
      const perm = await cameraService.requestPermission();
      setPermissionStatus(perm);

      if (perm !== 'granted') {
        const warning =
          'Camera access denied. Emergency dispatch will proceed without photos.';
        setCameraWarning(warning);
        setStage('completed');
        onComplete?.({
          frontPhoto: null,
          rearPhoto: null,
          frontError: warning,
          rearError: warning,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      // Start front camera stage
      setFacing('front');
      setStage('front_preparing');
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Camera initialization error';
      setCameraWarning(msg);
      setStage('completed');
      onComplete?.({
        frontPhoto: null,
        rearPhoto: null,
        frontError: msg,
        rearError: msg,
        completedAt: new Date().toISOString(),
      });
    }
  }, [onComplete]);

  // Invoked by <CameraView onCameraReady={...} />
  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Execution engine: monitors stage & camera readiness
  useEffect(() => {
    if (!isCameraReady || captureInProgress.current) return;

    // --- STAGE: FRONT CAMERA CAPTURE ---
    if (stage === 'front_preparing') {
      captureInProgress.current = true;
      setStage('front_capturing');

      // 500ms delay to allow hardware autofocus and auto-exposure to stabilize
      const timer = setTimeout(async () => {
        try {
          if (!cameraRef.current) throw new Error('Camera ref unavailable');

          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            skipProcessing: false,
          });

          if (!photo?.uri) throw new Error('No photo URI returned');

          const captured: CameraServiceResult = {
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            timestamp: new Date().toISOString(),
            facing: 'front',
          };
          setFrontPhoto(captured);

          // Advance to REAR camera
          captureInProgress.current = false;
          setIsCameraReady(false);
          setFacing('back');
          setStage('rear_preparing');
        } catch (err: unknown) {
          if (frontRetryCount.current < 1) {
            // Safe automatic retry ONCE
            frontRetryCount.current += 1;
            captureInProgress.current = false;
            setStage('front_preparing');
          } else {
            // Front photo failed after retry, proceed to rear camera
            const errText = 'Front camera capture failed after 1 retry';
            setCameraWarning(errText);
            captureInProgress.current = false;
            setIsCameraReady(false);
            setFacing('back');
            setStage('rear_preparing');
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    // --- STAGE: REAR CAMERA CAPTURE ---
    if (stage === 'rear_preparing') {
      captureInProgress.current = true;
      setStage('rear_capturing');

      const timer = setTimeout(async () => {
        try {
          if (!cameraRef.current) throw new Error('Camera ref unavailable');

          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            skipProcessing: false,
          });

          if (!photo?.uri) throw new Error('No photo URI returned');

          const captured: CameraServiceResult = {
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            timestamp: new Date().toISOString(),
            facing: 'back',
          };
          setRearPhoto(captured);

          // Both captures finished!
          captureInProgress.current = false;
          setStage('completed');
          onComplete?.({
            frontPhoto,
            rearPhoto: captured,
            completedAt: new Date().toISOString(),
          });
        } catch (err: unknown) {
          if (rearRetryCount.current < 1) {
            // Safe automatic retry ONCE
            rearRetryCount.current += 1;
            captureInProgress.current = false;
            setStage('rear_preparing');
          } else {
            // Rear photo failed after retry, conclude camera stage safely
            const errText = 'Rear camera capture failed after 1 retry';
            setCameraWarning(errText);
            captureInProgress.current = false;
            setStage('completed');
            onComplete?.({
              frontPhoto,
              rearPhoto: null,
              rearError: errText,
              completedAt: new Date().toISOString(),
            });
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stage, isCameraReady, frontPhoto, onComplete]);

  return {
    cameraRef,
    facing,
    stage,
    permissionStatus,
    frontPhoto,
    rearPhoto,
    cameraWarning,
    isComplete: stage === 'completed' || stage === 'failed',
    onCameraReady,
    startAutoCapture,
    photos: {
      frontPhoto,
      rearPhoto,
      frontError: cameraWarning ?? undefined,
      completedAt: stage === 'completed' ? new Date().toISOString() : undefined,
    },
  };
}

export default useAutoEmergencyCapture;
