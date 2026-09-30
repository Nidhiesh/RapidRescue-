/**
 * RapidRescue Driver Mobile App - Emergency Request Models
 * Strongly-typed domain models for incoming emergency dispatch requests,
 * priorities, response windows, and driver action states.
 */

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'NORMAL';

export type EmergencyRequestStatus =
  | 'NONE'
  | 'INCOMING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface EmergencyPickupLocation {
  latitude: number;
  longitude: number;
}

export interface PatientInfo {
  name?: string;
  phone?: string;
  photoUrl?: string;
}

export interface EmergencyRequest {
  id: string; // Identifier used for display and request mapping (maps to emergencyId)
  emergencyId?: string; // Direct backend UUID
  pickupLatitude: number;
  pickupLongitude: number;
  pickupLocation?: EmergencyPickupLocation;
  priority: EmergencyPriority;
  createdAt: number | string;
  responseDeadline?: string;
  timeoutSeconds?: number;
  distanceKm?: number;
  etaMinutes?: number;
  status: EmergencyRequestStatus;
  respondedAt?: number;

  // Patient & Clinical Data
  patient?: PatientInfo;
  patientName?: string;
  patientPhone?: string;
  patientPhotoUrl?: string;
  pickupAddress?: string;
  emergencyType?: string;
  estimatedDistance?: string;
  estimatedResponseTime?: string;
}

export type EmergencyAction = 'ACCEPT' | 'REJECT' | 'TIMEOUT';

export interface EmergencyResponsePayload {
  requestId: string;
  driverId: string;
  action: EmergencyAction;
  timestamp: number;
}

export interface EmergencyResponseResult {
  success: boolean;
  requestId: string;
  action: EmergencyAction;
  timestamp: number;
  isConflict?: boolean;
  error?: string;
}

/**
 * Backend Dispatch Request/Response payloads
 */
export interface DispatchRespondPayload {
  requestId: string;
  action: EmergencyAction;
}

export interface DispatchCompletePayload {
  requestId: string;
}

/**
 * 9 Backend Server WebSocket Event Definitions
 */
export interface EmergencyDispatchServerEvent {
  type: 'EMERGENCY_DISPATCH';
  data: {
    emergencyId: string;
    emergencyType?: string;
    priority: EmergencyPriority;
    patient?: PatientInfo;
    pickupLocation?: {
      latitude: number;
      longitude: number;
    };
    pickup?: {
      latitude: number;
      longitude: number;
    };
    distanceKm?: number;
    etaMinutes?: number;
    createdAt?: string;
    responseDeadline?: string;
    timeoutSeconds?: number;
  };
}

export interface DispatchTimeoutServerEvent {
  type: 'DISPATCH_TIMEOUT';
  data: {
    requestId?: string;
    emergencyId?: string;
    status: string;
  };
}

export interface DispatchResponseAckServerEvent {
  type: 'DISPATCH_RESPONSE_ACK';
  data: {
    requestId?: string;
    emergencyId?: string;
    action: string;
    status: string;
  };
}

export interface RequestUpdateServerEvent {
  type: 'REQUEST_UPDATE';
  data: {
    requestId?: string;
    emergencyId?: string;
    status: string;
  };
}

export interface PatientLocationServerEvent {
  type: 'PATIENT_LOCATION';
  data: {
    emergencyId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface DriverAssignedServerEvent {
  type: 'DRIVER_ASSIGNED';
  data: {
    emergencyId: string;
    driverId: string;
    status?: string;
  };
}

export interface EtaUpdateServerEvent {
  type: 'ETA_UPDATE';
  data: {
    emergencyId: string;
    distanceKm?: number;
    etaMinutes?: number;
  };
}

export interface EmergencyCompletedServerEvent {
  type: 'EMERGENCY_COMPLETED';
  data: {
    emergencyId?: string;
    requestId?: string;
    status?: string;
  };
}

export interface EmergencyCancelledServerEvent {
  type: 'EMERGENCY_CANCELLED';
  data: {
    emergencyId?: string;
    requestId?: string;
    reason?: string;
  };
}

export type ServerDispatchEvent =
  | EmergencyDispatchServerEvent
  | DispatchTimeoutServerEvent
  | DispatchResponseAckServerEvent
  | RequestUpdateServerEvent
  | PatientLocationServerEvent
  | DriverAssignedServerEvent
  | EtaUpdateServerEvent
  | EmergencyCompletedServerEvent
  | EmergencyCancelledServerEvent;

/**
 * Priority-based timeout countdown durations in seconds (fallback for mock mode)
 */
export const EMERGENCY_TIMEOUT_DURATIONS: Record<EmergencyPriority, number> = {
  CRITICAL: 20, // 20 seconds for critical triage
  HIGH: 40,     // 40 seconds for urgent calls
  NORMAL: 60,   // 60 seconds for standard transfers
};

