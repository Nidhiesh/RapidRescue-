/**
 * RapidRescue Driver Mobile App - Real-Time Service Abstraction
 * WebSocket dispatch streaming conforming to RapidRescue backend contract.
 * Dynamic session JWT authentication: wss://web-production-2c3bd.up.railway.app/ws/driver?token=<JWT>
 */

import { EmergencyRequest } from '../../types';
import { getWebSocketUrl, isMockEnabled, resolveBackendMediaUrl } from '../../config/apiConfig';
import { tokenStorage } from '../auth/tokenStorage';

export type EmergencyRequestListener = (request: EmergencyRequest) => void;
export type DispatchTimeoutListener = (data: { requestId: string; status: string }) => void;
export type DispatchResponseAckListener = (data: { requestId: string; action: string; status: string }) => void;
export type RequestUpdateListener = (data: { requestId: string; status: string }) => void;
export type PatientLocationListener = (data: { emergencyId: string; latitude: number; longitude: number; accuracy?: number }) => void;
export type DriverLocationUpdateListener = (data: { latitude: number; longitude: number; accuracy?: number }) => void;
export type DriverAssignedListener = (data: { emergencyId: string; driverId: string; status?: string }) => void;
export type EtaUpdateListener = (data: { emergencyId: string; distanceKm?: number; etaMinutes?: number }) => void;
export type EmergencyCompletedListener = (data: { emergencyId?: string; requestId?: string; status?: string }) => void;
export type EmergencyCancelledListener = (data: { emergencyId?: string; requestId?: string; reason?: string }) => void;
export type ConnectionChangeListener = (isConnected: boolean) => void;

export interface IRealtimeService {
  connect(tokenOverride?: string): Promise<void>;
  disconnect(): Promise<void>;
  onEmergencyRequest(callback: EmergencyRequestListener): () => void;
  onDispatchTimeout(callback: DispatchTimeoutListener): () => void;
  onDispatchResponseAck(callback: DispatchResponseAckListener): () => void;
  onRequestUpdate(callback: RequestUpdateListener): () => void;
  onPatientLocation(callback: PatientLocationListener): () => void;
  onDriverLocationUpdate(callback: DriverLocationUpdateListener): () => void;
  onDriverAssigned(callback: DriverAssignedListener): () => void;
  onEtaUpdate(callback: EtaUpdateListener): () => void;
  onEmergencyCompleted(callback: EmergencyCompletedListener): () => void;
  onEmergencyCancelled(callback: EmergencyCancelledListener): () => void;
  onConnectionChange(callback: ConnectionChangeListener): () => void;
  emitEmergencyRequest(request: EmergencyRequest): void;
  getIsConnected(): boolean;
}

class RealtimeService implements IRealtimeService {
  private isConnected: boolean = false;
  private socket: WebSocket | null = null;
  private shouldReconnect: boolean = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelayMs: number = 2000;
  private maxReconnectDelayMs: number = 15000;

  // Track recent emergency IDs to prevent duplicate alerts
  private recentEmergencyIds: Set<string> = new Set();

  private emergencyListeners: Set<EmergencyRequestListener> = new Set();
  private timeoutListeners: Set<DispatchTimeoutListener> = new Set();
  private responseAckListeners: Set<DispatchResponseAckListener> = new Set();
  private updateListeners: Set<RequestUpdateListener> = new Set();
  private patientLocationListeners: Set<PatientLocationListener> = new Set();
  private driverLocationUpdateListeners: Set<DriverLocationUpdateListener> = new Set();
  private driverAssignedListeners: Set<DriverAssignedListener> = new Set();
  private etaUpdateListeners: Set<EtaUpdateListener> = new Set();
  private emergencyCompletedListeners: Set<EmergencyCompletedListener> = new Set();
  private emergencyCancelledListeners: Set<EmergencyCancelledListener> = new Set();
  private connectionListeners: Set<ConnectionChangeListener> = new Set();

  /**
   * Generates dynamic WebSocket URL with the authenticated JWT session token.
   * Format: wss://web-production-2c3bd.up.railway.app/ws/driver?token=<JWT>
   */
  async getWebSocketEndpoint(tokenOverride?: string): Promise<string> {
    const token = tokenOverride || (await tokenStorage.getToken());
    return getWebSocketUrl(token);
  }

  /**
   * Connect to real-time dispatch stream
   */
  async connect(tokenOverride?: string): Promise<void> {
    if (isMockEnabled()) {
      this.setConnectionState(true);
      return;
    }

    // Prevent duplicate WebSocket connections
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.shouldReconnect = true;
    this.clearReconnectTimer();

    try {
      const token = tokenOverride || (await tokenStorage.getToken());
      if (!token) {
        // Unauthenticated session cannot connect to driver socket
        this.setConnectionState(false);
        return;
      }

      const url = getWebSocketUrl(token);
      if (!url) {
        this.setConnectionState(false);
        return;
      }

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnectionState(true);
      };

      this.socket.onmessage = (event) => {
        this.handleSocketMessage(event.data);
      };

      this.socket.onerror = () => {
        // Socket error handled safely without exposing credentials or crashing
      };

      this.socket.onclose = (event) => {
        this.setConnectionState(false);
        this.socket = null;

        // Check for authentication failure codes (e.g. 4001, 4003, 1008)
        if (event.code === 4001 || event.code === 4003 || event.code === 1008) {
          // Token expired or invalid - stop auto-reconnecting
          this.shouldReconnect = false;
          return;
        }

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.setConnectionState(false);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Safe exponential backoff reconnection scheduler
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectDelayMs
    );
    this.reconnectAttempts += 1;

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setConnectionState(connected: boolean): void {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.connectionListeners.forEach((listener) => {
        try {
          listener(connected);
        } catch {
          // Safe listener execution
        }
      });
    }
  }

  /**
   * Parse incoming WebSocket event frame according to backend contract.
   * Handles all 9 server events:
   * 1. EMERGENCY_DISPATCH
   * 2. DISPATCH_TIMEOUT
   * 3. DISPATCH_RESPONSE_ACK
   * 4. REQUEST_UPDATE
   * 5. PATIENT_LOCATION
   * 6. DRIVER_ASSIGNED
   * 7. ETA_UPDATE
   * 8. EMERGENCY_COMPLETED
   * 9. EMERGENCY_CANCELLED
   */
  private handleSocketMessage(rawData: string): void {
    try {
      const parsed = JSON.parse(rawData);
      if (!parsed || typeof parsed !== 'object') return;

      const eventType = parsed.type;
      const data = parsed.data || parsed.payload;

      if (!eventType || !data) return;

      switch (eventType) {
        case 'EMERGENCY_DISPATCH': {
          const emergencyId = String(
            data.emergencyId || data.emergency_id || data.id || data.requestId || ''
          );
          if (!emergencyId) return;

          // Prevent duplicate alerts
          if (this.recentEmergencyIds.has(emergencyId)) {
            return;
          }
          this.recentEmergencyIds.add(emergencyId);
          setTimeout(() => {
            this.recentEmergencyIds.delete(emergencyId);
          }, 60000);

          const pickupLat = Number(
            data.pickupLocation?.latitude ??
            data.pickup?.latitude ??
            data.pickupLatitude ??
            data.pickup_latitude ??
            data.latitude ??
            0
          );
          const pickupLng = Number(
            data.pickupLocation?.longitude ??
            data.pickup?.longitude ??
            data.pickupLongitude ??
            data.pickup_longitude ??
            data.longitude ??
            0
          );

          const rawPatient = data.patient;
          const photoCandidate =
            rawPatient?.photoUrl ||
            rawPatient?.photo_url ||
            rawPatient?.photo ||
            data.patientPhotoUrl ||
            data.patient_photo_url ||
            data.patientPhoto ||
            data.photoUrl ||
            data.photo;
          const resolvedPhotoUrl = photoCandidate ? resolveBackendMediaUrl(photoCandidate) : undefined;

          const patientName = String(
            rawPatient?.name ||
            rawPatient?.fullName ||
            rawPatient?.full_name ||
            data.patientName ||
            data.patient_name ||
            data.name ||
            'Emergency Patient'
          );

          const patientPhone = String(
            rawPatient?.phone ||
            rawPatient?.mobileNumber ||
            rawPatient?.mobile_number ||
            data.patientPhone ||
            data.patient_phone ||
            data.phone ||
            'Direct Dispatch Relay'
          );

          const pickupAddress =
            data.pickupAddress ||
            data.pickup_address ||
            data.address ||
            data.pickupLocation?.address ||
            data.pickup?.address;

          const emergencyType =
            data.emergencyType ||
            data.emergency_type ||
            data.type ||
            'PRIORITY EMERGENCY';

          const distanceVal =
            data.distanceKm ??
            data.distance_km ??
            data.distance;
          const etaVal =
            data.etaMinutes ??
            data.eta_minutes ??
            data.eta ??
            data.eta_min;
          const responseDeadline =
            data.responseDeadline ||
            data.response_deadline ||
            data.deadline;

          const distanceNum = distanceVal !== undefined ? Number(distanceVal) : undefined;
          const etaNum = etaVal !== undefined ? Number(etaVal) : undefined;

          const patient = {
            name: patientName,
            phone: patientPhone,
            photoUrl: resolvedPhotoUrl,
          };

          const req: EmergencyRequest = {
            id: emergencyId,
            emergencyId,
            pickupLatitude: pickupLat,
            pickupLongitude: pickupLng,
            pickupLocation: {
              latitude: pickupLat,
              longitude: pickupLng,
            },
            priority: data.priority || 'CRITICAL',
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            responseDeadline,
            timeoutSeconds: data.timeoutSeconds ?? data.timeout_seconds,
            distanceKm: distanceNum,
            etaMinutes: etaNum,
            status: 'INCOMING',
            patient,
            patientName,
            patientPhone,
            patientPhotoUrl: resolvedPhotoUrl,
            pickupAddress,
            emergencyType,
            estimatedDistance: distanceNum !== undefined ? `${distanceNum} km` : data.estimatedDistance,
            estimatedResponseTime: etaNum !== undefined ? `${etaNum} min` : data.estimatedResponseTime,
          };

          this.emitEmergencyRequest(req);
          break;
        }

        case 'DISPATCH_TIMEOUT': {
          const timeoutData = {
            requestId: String(data.requestId || data.emergencyId || data.emergency_id || ''),
            status: String(data.status || 'TIMEOUT'),
          };
          this.timeoutListeners.forEach((listener) => {
            try {
              listener(timeoutData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'DISPATCH_RESPONSE_ACK': {
          const ackData = {
            requestId: String(data.requestId || data.emergencyId || data.emergency_id || ''),
            action: String(data.action || ''),
            status: String(data.status || ''),
          };
          this.responseAckListeners.forEach((listener) => {
            try {
              listener(ackData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'REQUEST_UPDATE': {
          const updateData = {
            requestId: String(data.requestId || data.emergencyId || data.emergency_id || ''),
            status: String(data.status || ''),
          };
          this.updateListeners.forEach((listener) => {
            try {
              listener(updateData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'PATIENT_LOCATION': {
          const locData = {
            emergencyId: String(data.emergencyId || data.emergency_id || data.requestId || data.id || ''),
            latitude: Number(data.latitude ?? data.pickupLatitude ?? data.pickup_latitude ?? data.lat ?? 0),
            longitude: Number(data.longitude ?? data.pickupLongitude ?? data.pickup_longitude ?? data.lng ?? data.lon ?? 0),
            accuracy: data.accuracy !== undefined ? Number(data.accuracy) : undefined,
          };
          this.patientLocationListeners.forEach((listener) => {
            try {
              listener(locData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'DRIVER_LOCATION_UPDATE': {
          const locData = {
            latitude: Number(data.latitude ?? data.lat ?? 0),
            longitude: Number(data.longitude ?? data.lng ?? 0),
            accuracy: data.accuracy !== undefined ? Number(data.accuracy) : undefined,
          };
          this.driverLocationUpdateListeners.forEach((listener) => {
            try {
              listener(locData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'DRIVER_ASSIGNED': {
          const assignedData = {
            emergencyId: String(data.emergencyId || data.emergency_id || data.requestId || ''),
            driverId: String(data.driverId || data.driver_id || ''),
            status: data.status ? String(data.status) : undefined,
          };
          this.driverAssignedListeners.forEach((listener) => {
            try {
              listener(assignedData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'ETA_UPDATE': {
          const distanceVal =
            data.distanceKm ??
            data.distance_km ??
            data.distance;
          const etaVal =
            data.etaMinutes ??
            data.eta_minutes ??
            data.eta ??
            data.eta_min;

          const etaData = {
            emergencyId: String(data.emergencyId || data.emergency_id || data.requestId || data.id || ''),
            distanceKm: distanceVal !== undefined ? Number(distanceVal) : undefined,
            etaMinutes: etaVal !== undefined ? Number(etaVal) : undefined,
          };
          this.etaUpdateListeners.forEach((listener) => {
            try {
              listener(etaData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'EMERGENCY_COMPLETED': {
          const compData = {
            emergencyId: data.emergencyId || data.emergency_id ? String(data.emergencyId || data.emergency_id) : undefined,
            requestId: data.requestId || data.request_id ? String(data.requestId || data.request_id) : undefined,
            status: String(data.status || 'COMPLETED'),
          };
          this.emergencyCompletedListeners.forEach((listener) => {
            try {
              listener(compData);
            } catch {
              // Safety
            }
          });
          break;
        }

        case 'EMERGENCY_CANCELLED': {
          const cancelData = {
            emergencyId: data.emergencyId || data.emergency_id ? String(data.emergencyId || data.emergency_id) : undefined,
            requestId: data.requestId || data.request_id ? String(data.requestId || data.request_id) : undefined,
            reason: data.reason ? String(data.reason) : undefined,
          };
          this.emergencyCancelledListeners.forEach((listener) => {
            try {
              listener(cancelData);
            } catch {
              // Safety
            }
          });
          break;
        }

        default:
          // Unknown future event handled gracefully without crashing
          break;
      }
    } catch {
      // Non-JSON message safety
    }
  }

  /**
   * Disconnect from real-time dispatch stream
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.clearReconnectTimer();

    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Safe close
      }
      this.socket = null;
    }
    this.setConnectionState(false);
  }

  /**
   * Register a listener for incoming emergency dispatch requests
   */
  onEmergencyRequest(callback: EmergencyRequestListener): () => void {
    this.emergencyListeners.add(callback);
    return () => {
      this.emergencyListeners.delete(callback);
    };
  }

  /**
   * Register a listener for DISPATCH_TIMEOUT events
   */
  onDispatchTimeout(callback: DispatchTimeoutListener): () => void {
    this.timeoutListeners.add(callback);
    return () => {
      this.timeoutListeners.delete(callback);
    };
  }

  /**
   * Register a listener for DISPATCH_RESPONSE_ACK events
   */
  onDispatchResponseAck(callback: DispatchResponseAckListener): () => void {
    this.responseAckListeners.add(callback);
    return () => {
      this.responseAckListeners.delete(callback);
    };
  }

  /**
   * Register a listener for REQUEST_UPDATE events
   */
  onRequestUpdate(callback: RequestUpdateListener): () => void {
    this.updateListeners.add(callback);
    return () => {
      this.updateListeners.delete(callback);
    };
  }

  /**
   * Register a listener for PATIENT_LOCATION events
   */
  onPatientLocation(callback: PatientLocationListener): () => void {
    this.patientLocationListeners.add(callback);
    return () => {
      this.patientLocationListeners.delete(callback);
    };
  }

  /**
   * Register a listener for DRIVER_LOCATION_UPDATE events
   */
  onDriverLocationUpdate(callback: DriverLocationUpdateListener): () => void {
    this.driverLocationUpdateListeners.add(callback);
    return () => {
      this.driverLocationUpdateListeners.delete(callback);
    };
  }

  /**
   * Register a listener for DRIVER_ASSIGNED events
   */
  onDriverAssigned(callback: DriverAssignedListener): () => void {
    this.driverAssignedListeners.add(callback);
    return () => {
      this.driverAssignedListeners.delete(callback);
    };
  }

  /**
   * Register a listener for ETA_UPDATE events
   */
  onEtaUpdate(callback: EtaUpdateListener): () => void {
    this.etaUpdateListeners.add(callback);
    return () => {
      this.etaUpdateListeners.delete(callback);
    };
  }

  /**
   * Register a listener for EMERGENCY_COMPLETED events
   */
  onEmergencyCompleted(callback: EmergencyCompletedListener): () => void {
    this.emergencyCompletedListeners.add(callback);
    return () => {
      this.emergencyCompletedListeners.delete(callback);
    };
  }

  /**
   * Register a listener for EMERGENCY_CANCELLED events
   */
  onEmergencyCancelled(callback: EmergencyCancelledListener): () => void {
    this.emergencyCancelledListeners.add(callback);
    return () => {
      this.emergencyCancelledListeners.delete(callback);
    };
  }

  /**
   * Register a listener for WebSocket connection state changes
   */
  onConnectionChange(callback: ConnectionChangeListener): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Trigger an incoming emergency dispatch (used by simulator or mock service)
   */
  emitEmergencyRequest(request: EmergencyRequest): void {
    this.emergencyListeners.forEach((listener) => {
      try {
        listener(request);
      } catch {
        // Listener error safety
      }
    });
  }

  /**
   * Check connection status
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeService: IRealtimeService = new RealtimeService();
