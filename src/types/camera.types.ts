/**
 * RapidRescue Camera Types
 *
 * Typed models for camera permission state, automated sequential
 * front/rear photo capture, and error outcomes.
 */

export type CameraPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

export interface CameraServiceResult {
  uri: string;
  width?: number;
  height?: number;
  timestamp: string;
  facing: 'front' | 'back';
}

export type CameraError =
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAPTURE_FAILED'
  | 'USER_CANCELLED';

export interface CameraResult {
  success: true;
  photo: CameraServiceResult;
}

export interface CameraFailure {
  success: false;
  error: CameraError;
  message: string;
}

export type CameraOutcome = CameraResult | CameraFailure;

/**
 * Exact Camera Automation State Machine (FRONT -> REAR)
 */
export type CameraAutomationState =
  | 'IDLE'
  | 'INITIALIZING_FRONT'
  | 'FRONT_READY'
  | 'CAPTURING_FRONT'
  | 'FRONT_CAPTURED'
  | 'INITIALIZING_REAR'
  | 'REAR_READY'
  | 'CAPTURING_REAR'
  | 'REAR_CAPTURED'
  | 'COMPLETE'
  | 'ERROR';

export type AutoCaptureStage =
  | 'idle'
  | 'requesting_permission'
  | 'front_preparing'
  | 'front_capturing'
  | 'rear_preparing'
  | 'rear_capturing'
  | 'completed'
  | 'failed';

export interface AutoCapturedPhotos {
  frontPhoto?: CameraServiceResult | null;
  rearPhoto?: CameraServiceResult | null;
  frontPhotoUri?: string | null;
  rearPhotoUri?: string | null;
  frontError?: string;
  rearError?: string;
  completedAt?: string;
  error?: string;
}
