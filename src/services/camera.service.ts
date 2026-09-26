/**
 * RapidRescue Camera Service (Phase 3)
 *
 * Encapsulates all camera logic:
 * - Permission request and status check
 * - Front camera photo capture (one photo only — no video)
 *
 * Screens and hooks must NOT call Camera APIs directly.
 * All camera logic lives here.
 */

import {
  Camera,
} from 'expo-camera';
import {
  CameraPermissionStatus,
  CameraError,
} from '@/types/camera.types';

export interface ICameraService {
  checkPermission(): Promise<CameraPermissionStatus>;
  requestPermission(): Promise<CameraPermissionStatus>;
}

class CameraService implements ICameraService {
  /**
   * Returns the current camera permission status without prompting.
   */
  async checkPermission(): Promise<CameraPermissionStatus> {
    const perm = await Camera.getCameraPermissionsAsync();
    if (perm.granted) return 'granted';
    if (perm.status === 'undetermined') return 'undetermined';
    return 'denied';
  }

  /**
   * Requests camera permission from the OS.
   * Returns the resulting status.
   */
  async requestPermission(): Promise<CameraPermissionStatus> {
    const perm = await Camera.requestCameraPermissionsAsync();
    if (perm.granted) return 'granted';
    return 'denied';
  }

  /**
   * Maps expo-camera status string to our typed CameraPermissionStatus.
   */
  mapPermissionStatus(status: string): CameraPermissionStatus {
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }
}

export const cameraService = new CameraService();

/**
 * Human-readable error message lookup for camera errors.
 */
export function getCameraErrorMessage(error: CameraError): string {
  switch (error) {
    case 'PERMISSION_DENIED':
      return 'Camera access was denied. Please enable it in your device Settings to continue.';
    case 'CAMERA_UNAVAILABLE':
      return 'Camera is not available on this device.';
    case 'CAPTURE_FAILED':
      return 'Failed to capture the photo. Please try again.';
    case 'USER_CANCELLED':
      return 'Photo capture was cancelled.';
  }
}

export default cameraService;
