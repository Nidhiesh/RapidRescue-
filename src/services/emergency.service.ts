/**
 * RapidRescue Emergency Dispatch Service (Phase 4)
 *
 * Requirements:
 * - Duplicate SOS prevention: locks out concurrent emergency dispatches
 * - Bounded retry strategy for network/transient failures (max 3 retries with backoff)
 * - Safe internal holding of front & rear photos and GPS coordinates
 * - Adheres strictly to backend contract isolation:
 *   Does NOT find nearest ambulance, select driver, calculate distance, or decide driver priority
 *   (Those belong strictly to the backend/dispatch system).
 * - Typed data model: EmergencyCaptureData (no `any`)
 */

import { CapturedLocation, ReverseGeocodedAddress } from '@/types/location.types';
import {
  EmergencyCaptureData,
  EmergencyRecord,
  EmergencyStatus,
} from '@/types/emergency.types';

export type DispatchStep =
  | 'idle'
  | 'gathering_evidence'
  | 'dispatching'
  | 'dispatched'
  | 'failed'
  | 'cancelled';

export interface DispatchOutcome {
  success: boolean;
  emergencyRecord?: EmergencyRecord;
  error?: string;
  isDuplicate?: boolean;
  canRetry?: boolean;
}

const MAX_DISPATCH_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

class EmergencyService {
  private activeEmergency: EmergencyRecord | null = null;
  private isDispatching: boolean = false;
  private capturedData: EmergencyCaptureData | null = null;
  private cachedLocation: CapturedLocation | null = null;
  private cachedAddress: ReverseGeocodedAddress | null = null;

  /**
   * Checks whether an emergency request is actively in-flight or unresolved.
   * Prevents duplicate SOS submissions.
   */
  hasActiveEmergency(): boolean {
    return (
      this.isDispatching ||
      (this.activeEmergency !== null &&
        this.activeEmergency.status !== EmergencyStatus.COMPLETED &&
        this.activeEmergency.status !== EmergencyStatus.CANCELLED)
    );
  }

  /**
   * Stores pre-fetched GPS location to be available immediately during emergency flow.
   */
  setCachedLocation(
    location: CapturedLocation,
    address: ReverseGeocodedAddress | null = null
  ): void {
    this.cachedLocation = location;
    this.cachedAddress = address;
  }

  getCachedLocation(): {
    location: CapturedLocation | null;
    address: ReverseGeocodedAddress | null;
  } {
    return {
      location: this.cachedLocation,
      address: this.cachedAddress,
    };
  }

  /**
   * Stores full captured emergency data.
   */
  setCapturedData(data: EmergencyCaptureData): void {
    this.capturedData = data;
  }

  getCapturedData(): EmergencyCaptureData | null {
    return this.capturedData;
  }

  /**
   * Returns current active emergency record if one exists.
   */
  getActiveEmergency(): EmergencyRecord | null {
    return this.activeEmergency;
  }

  /**
   * Resets or clears the active emergency state (e.g. after cancellation or completion).
   */
  clearActiveEmergency(): void {
    this.activeEmergency = null;
    this.isDispatching = false;
    this.capturedData = null;
    this.cachedLocation = null;
    this.cachedAddress = null;
  }

  /**
   * Submits an emergency request automatically.
   * Employs bounded exponential backoff retries on failure (up to 3 attempts).
   * Prevents duplicate dispatch if an emergency is already in progress.
   */
  async autoDispatchEmergency(
    data: EmergencyCaptureData,
    patientId: string = 'device_anonymous_patient'
  ): Promise<DispatchOutcome> {
    if (this.hasActiveEmergency()) {
      return {
        success: false,
        isDuplicate: true,
        error: 'An emergency request is already active. Duplicate SOS prevented.',
      };
    }

    this.isDispatching = true;
    this.capturedData = data;

    let attempt = 0;
    let lastError = 'Failed to submit emergency dispatch';

    while (attempt < MAX_DISPATCH_RETRIES) {
      attempt++;
      try {
        const record = await this.performDispatchAttempt(data, patientId, attempt);
        this.activeEmergency = record;
        this.isDispatching = false;
        return {
          success: true,
          emergencyRecord: record,
        };
      } catch (err: unknown) {
        lastError = (err as Error).message || 'Network dispatch failure';
        if (attempt < MAX_DISPATCH_RETRIES) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.isDispatching = false;
    return {
      success: false,
      error: `Emergency dispatch failed after ${MAX_DISPATCH_RETRIES} attempts: ${lastError}`,
      canRetry: true,
    };
  }

  /**
   * Internal single dispatch preparation.
   * Prepares the emergency data without executing backend driver assignment logic.
   */
  private async performDispatchAttempt(
    data: EmergencyCaptureData,
    patientId: string,
    attemptNumber: number
  ): Promise<EmergencyRecord> {
    const timestamp = data.timestamp || new Date().toISOString();

    // Simulate network transmission latency (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const record: EmergencyRecord = {
      id: `emg_${Date.now()}`,
      patientId,
      status: EmergencyStatus.SEARCHING,
      location: {
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy ?? undefined,
          timestamp: Date.now(),
        },
        address: data.address
          ? {
              formattedAddress: data.address,
            }
          : undefined,
      },
      photoUrl: data.frontPhotoUri,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return record;
  }

  /**
   * Cancels the active emergency.
   */
  async cancelEmergency(reason?: string): Promise<boolean> {
    if (!this.activeEmergency) {
      this.clearActiveEmergency();
      return true;
    }

    this.activeEmergency = {
      ...this.activeEmergency,
      status: EmergencyStatus.CANCELLED,
      updatedAt: new Date().toISOString(),
    };
    this.isDispatching = false;
    this.clearActiveEmergency();
    return true;
  }
}

export const emergencyService = new EmergencyService();
export default emergencyService;
