/**
 * RapidRescue useCamera Hook (Phase 3)
 *
 * Provides camera permission state, photo capture state, and
 * a ref for the CameraView that can be placed in any screen.
 *
 * Screens must NOT call Camera APIs directly.
 * All camera interactions flow through this hook.
 */

import { useRef, useState, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import {
  CameraPermissionStatus,
  CameraServiceResult,
  CameraError,
  CameraOutcome,
} from '@/types/camera.types';
import { cameraService, getCameraErrorMessage } from '@/services/camera.service';

export interface UseCameraReturn {
  /** Ref attached to the <CameraView /> component in the screen */
  cameraRef: React.RefObject<CameraView | null>;
  /** Current OS permission status */
  permissionStatus: CameraPermissionStatus;
  /** Whether a capture is in progress */
  isCapturing: boolean;
  /** The successfully captured photo */
  capturedPhoto: CameraServiceResult | null;
  /** Current error, if any */
  error: CameraError | null;
  /** Human-readable error message */
  errorMessage: string | null;
  /** Request permission from the user */
  requestPermission: () => Promise<CameraPermissionStatus>;
  /** Trigger a single photo capture */
  capturePhoto: () => Promise<CameraOutcome>;
  /** Reset captured photo and errors to allow retake */
  resetCapture: () => void;
}

export function useCamera(): UseCameraReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('undetermined');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CameraServiceResult | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<CameraPermissionStatus> => {
    const status = await cameraService.requestPermission();
    setPermissionStatus(status);
    if (status === 'denied') {
      setError('PERMISSION_DENIED');
      setErrorMessage(getCameraErrorMessage('PERMISSION_DENIED'));
    } else {
      setError(null);
      setErrorMessage(null);
    }
    return status;
  }, []);

  const capturePhoto = useCallback(async (): Promise<CameraOutcome> => {
    if (!cameraRef.current) {
      const failure: CameraOutcome = {
        success: false,
        error: 'CAMERA_UNAVAILABLE',
        message: getCameraErrorMessage('CAMERA_UNAVAILABLE'),
      };
      setError('CAMERA_UNAVAILABLE');
      setErrorMessage(failure.message);
      return failure;
    }

    setIsCapturing(true);
    setError(null);
    setErrorMessage(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        const failure: CameraOutcome = {
          success: false,
          error: 'CAPTURE_FAILED',
          message: getCameraErrorMessage('CAPTURE_FAILED'),
        };
        setError('CAPTURE_FAILED');
        setErrorMessage(failure.message);
        return failure;
      }

      const result: CameraServiceResult = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        timestamp: new Date().toISOString(),
        facing: 'front',
      };

      setCapturedPhoto(result);

      return { success: true, photo: result };
    } catch (err: unknown) {
      const failure: CameraOutcome = {
        success: false,
        error: 'CAPTURE_FAILED',
        message: getCameraErrorMessage('CAPTURE_FAILED'),
      };
      setError('CAPTURE_FAILED');
      setErrorMessage(`${failure.message} (${(err as Error).message ?? 'Unknown'})`);
      return failure;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedPhoto(null);
    setError(null);
    setErrorMessage(null);
  }, []);

  return {
    cameraRef,
    permissionStatus,
    isCapturing,
    capturedPhoto,
    error,
    errorMessage,
    requestPermission,
    capturePhoto,
    resetCapture,
  };
}

export default useCamera;
