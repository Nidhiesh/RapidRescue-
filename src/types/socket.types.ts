/**
 * RapidRescue WebSocket Contract Types
 *
 * Real-time event contracts for bidirectional communication with FastAPI backend.
 */

import { EmergencyStatus } from './emergency.types';
import { LiveTelemetry } from './tracking.types';

export type WebSocketEventType =
  | 'CONNECTION_ACK'
  | 'STATUS_CHANGED'
  | 'DRIVER_ASSIGNED'
  | 'TELEMETRY_UPDATE'
  | 'AMBULANCE_ARRIVED'
  | 'EMERGENCY_COMPLETED'
  | 'EMERGENCY_CANCELLED'
  | 'ERROR';

export interface WebSocketMessage<T = unknown> {
  event: WebSocketEventType;
  emergencyId: string;
  payload: T;
  timestamp: string;
}

export interface StatusChangedPayload {
  previousStatus: EmergencyStatus;
  newStatus: EmergencyStatus;
  message?: string;
}

export interface TelemetryUpdatePayload {
  telemetry: LiveTelemetry;
}

export interface SocketErrorPayload {
  code: string;
  message: string;
}
