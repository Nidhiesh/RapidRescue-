/**
 * RapidRescue Driver Mobile App - Driver Service Interface & Dispatch Bridge
 * Architectural boundary for driver profile, duty status, availability, and telemetry.
 *
 * Implements real FastAPI backend communication:
 * - GET   /api/v1/drivers/me
 * - PATCH /api/v1/drivers/me/duty-status
 * - PATCH /api/v1/drivers/me/availability
 * - POST  /api/v1/drivers/me/location
 *
 * Automatically delegates to mockDriverService when EXPO_PUBLIC_USE_MOCK_SERVICES=true.
 */

import {
  DriverProfile,
  DriverLocationUpdatePayload,
  IDriverService,
  DriverDutyStatus,
  DriverAvailability,
  VerificationStatus,
} from '../../types/index';
import { isMockEnabled, getBaseUrl } from '../../config/apiConfig';
import { apiClient } from '../api/apiClient';
import { isApiError } from '../api/apiError';
import { mockDriverService } from './mockDriverService';

/**
 * Flexible interface matching FastAPI driver profile response
 */
interface BackendDriverProfilePayload {
  id?: string;
  driverId?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  full_name?: string;
  displayName?: string;
  mobileNumber?: string;
  mobile_number?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  address?: string;
  residential_address?: string;
  emergencyContact?: string;
  emergency_contact?: string;
  yearsOfExperience?: number | string;
  years_of_experience?: number | string;
  verificationStatus?: VerificationStatus;
  verification_status?: VerificationStatus;
  isVerified?: boolean;
  dutyStatus?: DriverDutyStatus;
  duty_status?: DriverDutyStatus;
  availability?: DriverAvailability;
  availabilityStatus?: DriverAvailability;
  availability_status?: DriverAvailability;

  // Wrapped response
  success?: boolean;
  driver?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

interface BackendDutyStatusResponse {
  success?: boolean;
  dutyStatus?: DriverDutyStatus;
  duty_status?: DriverDutyStatus;
  status?: DriverDutyStatus;
  availability?: DriverAvailability;
  availabilityStatus?: DriverAvailability;
  availability_status?: DriverAvailability;
  message?: string;
}

interface BackendAvailabilityResponse {
  success?: boolean;
  availability?: DriverAvailability;
  availabilityStatus?: DriverAvailability;
  availability_status?: DriverAvailability;
  status?: DriverAvailability;
  message?: string;
}

/**
 * Parses raw backend response into a strongly-typed DriverProfile
 */
function parseDriverProfile(raw: unknown, fallbackId?: string): DriverProfile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Malformed driver profile response received from server.');
  }

  const record = raw as BackendDriverProfilePayload;
  const source: Record<string, unknown> =
    (record.driver as Record<string, unknown>) ||
    (record.profile as Record<string, unknown>) ||
    (record.data as Record<string, unknown>) ||
    (record as Record<string, unknown>);

  const id = String(
    source.driverId || source.id || source.userId || fallbackId || 'RR-DRV-1001'
  );
  const fullName = String(
    source.fullName || source.full_name || source.name || 'Ambulance Driver'
  );
  const mobileNumber = String(
    source.mobileNumber || source.mobile_number || source.phone || ''
  );
  const email = String(source.email || '');
  const dateOfBirth =
    source.dateOfBirth || source.date_of_birth
      ? String(source.dateOfBirth || source.date_of_birth)
      : undefined;
  const address =
    source.address || source.residential_address
      ? String(source.address || source.residential_address)
      : undefined;
  const emergencyContact =
    source.emergencyContact || source.emergency_contact
      ? String(source.emergencyContact || source.emergency_contact)
      : undefined;

  const rawExp = source.yearsOfExperience ?? source.years_of_experience;
  const yearsOfExperience =
    rawExp !== undefined && rawExp !== null && !isNaN(Number(rawExp)) ? Number(rawExp) : 0;

  const rawVerif = String(
    source.verificationStatus || source.verification_status || ''
  ).toUpperCase() as VerificationStatus;

  const verificationStatus: VerificationStatus =
    rawVerif === 'VERIFIED' ||
    rawVerif === 'PENDING' ||
    rawVerif === 'UNDER_REVIEW' ||
    rawVerif === 'REJECTED'
      ? rawVerif
      : source.isVerified === true
      ? 'VERIFIED'
      : 'NOT_SUBMITTED';

  const isVerified = verificationStatus === 'VERIFIED' || source.isVerified === true;

  const rawDuty = String(source.dutyStatus || source.duty_status || source.status || '').toUpperCase();
  const dutyStatus: DriverDutyStatus = rawDuty === 'ONLINE' ? 'ONLINE' : 'OFFLINE';

  const rawAvail = String(
    source.availability || source.availabilityStatus || source.availability_status || ''
  ).toUpperCase();
  const availability: DriverAvailability =
    rawAvail === 'BUSY'
      ? 'BUSY'
      : rawAvail === 'AVAILABLE'
      ? 'AVAILABLE'
      : rawAvail === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : dutyStatus === 'ONLINE'
      ? 'AVAILABLE'
      : 'UNAVAILABLE';

  return {
    id,
    fullName,
    mobileNumber,
    email,
    dateOfBirth,
    address,
    emergencyContact,
    yearsOfExperience,
    isVerified,
    verificationStatus,
    dutyStatus,
    availability,
  };
}

class DriverService implements IDriverService {
  /**
   * Retrieves active driver profile from backend (GET /api/v1/drivers/me)
   * Backend is the source of truth for verification, duty, and availability.
   */
  async getProfile(driverId?: string): Promise<DriverProfile> {
    if (isMockEnabled()) {
      return mockDriverService.getProfile(driverId);
    }

    try {
      const response = await apiClient.get<BackendDriverProfilePayload>('/api/v1/drivers/me');
      return parseDriverProfile(response.data, driverId);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 401) {
          throw new Error('Driver session has expired. Please sign in again.');
        }
        if (err.code === 'NETWORK_ERROR' || err.status === 0) {
          const backendUrl = getBaseUrl() || 'https://web-production-2c3bd.up.railway.app';
          throw new Error(`Unable to connect to dispatch server (${backendUrl}).`);
        }
        throw new Error(err.message || 'Failed to retrieve driver profile.');
      }
      throw err instanceof Error ? err : new Error('Failed to retrieve driver profile.');
    }
  }

  /**
   * Updates shift duty status (ONLINE / OFFLINE) via PATCH /api/v1/drivers/me/duty-status
   *
   * ONLINE payload: { status: "ONLINE", latitude, longitude, accuracy }
   * OFFLINE payload: { status: "OFFLINE" }
   */
  async updateDutyStatus(
    driverId: string,
    status: DriverDutyStatus,
    location?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<{
    success: boolean;
    dutyStatus: DriverDutyStatus;
    availability?: DriverAvailability;
    error?: string;
  }> {
    if (isMockEnabled()) {
      return mockDriverService.updateDutyStatus(driverId, status, location);
    }

    const payload =
      status === 'ONLINE'
        ? {
            status: 'ONLINE',
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            accuracy: location?.accuracy,
          }
        : {
            status: 'OFFLINE',
          };

    try {
      const response = await apiClient.patch<BackendDutyStatusResponse>(
        '/api/v1/drivers/me/duty-status',
        payload
      );

      const resData = response.data || {};
      const returnedDuty = String(
        resData.dutyStatus || resData.duty_status || resData.status || status
      ).toUpperCase() as DriverDutyStatus;

      const rawAvail = String(
        resData.availability || resData.availabilityStatus || resData.availability_status || ''
      ).toUpperCase();

      const resultingAvailability: DriverAvailability =
        rawAvail === 'BUSY'
          ? 'BUSY'
          : rawAvail === 'AVAILABLE'
          ? 'AVAILABLE'
          : rawAvail === 'UNAVAILABLE'
          ? 'UNAVAILABLE'
          : returnedDuty === 'ONLINE'
          ? 'AVAILABLE'
          : 'UNAVAILABLE';

      return {
        success: true,
        dutyStatus: returnedDuty === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
        availability: resultingAvailability,
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to update duty status on dispatch server.';
      if (isApiError(err)) {
        if (err.status === 403) {
          errorMessage =
            err.message || 'Verification required: only verified drivers can transition to ONLINE.';
        } else if (err.status === 401) {
          errorMessage = 'Authentication session expired. Please sign in again.';
        } else if (err.code === 'NETWORK_ERROR' || err.status === 0) {
          const backendUrl = getBaseUrl() || 'https://web-production-2c3bd.up.railway.app';
          errorMessage = `Unable to connect to dispatch server (${backendUrl}). Please check network connectivity.`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      return {
        success: false,
        dutyStatus: 'OFFLINE',
        availability: 'UNAVAILABLE',
        error: errorMessage,
      };
    }
  }

  /**
   * Updates dispatch availability (AVAILABLE / UNAVAILABLE / BUSY) via PATCH /api/v1/drivers/me/availability
   */
  async updateAvailability(
    driverId: string,
    availability: DriverAvailability
  ): Promise<{
    success: boolean;
    availability: DriverAvailability;
    error?: string;
  }> {
    if (isMockEnabled()) {
      return mockDriverService.updateAvailability(driverId, availability);
    }

    try {
      const response = await apiClient.patch<BackendAvailabilityResponse>(
        '/api/v1/drivers/me/availability',
        {
          availability,
          status: availability,
        }
      );

      const resData = response.data || {};
      const returnedAvail = String(
        resData.availability || resData.availabilityStatus || resData.availability_status || resData.status || availability
      ).toUpperCase() as DriverAvailability;

      return {
        success: true,
        availability: returnedAvail === 'BUSY' ? 'BUSY' : returnedAvail === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
      };
    } catch (err: unknown) {
      let errorMessage = 'Failed to update availability status on dispatch server.';
      if (isApiError(err)) {
        if (err.status === 401) {
          errorMessage = 'Authentication session expired. Please sign in again.';
        } else if (err.code === 'NETWORK_ERROR' || err.status === 0) {
          const backendUrl = getBaseUrl() || 'https://web-production-2c3bd.up.railway.app';
          errorMessage = `Unable to connect to dispatch server (${backendUrl}).`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      return {
        success: false,
        availability,
        error: errorMessage,
      };
    }
  }

  /**
   * Updates driver GPS position
   * Uses POST /api/v1/drivers/me/location according to backend contract
   */
  async updateLocation(
    payload: DriverLocationUpdatePayload
  ): Promise<{ success: boolean; timestamp: number }> {
    if (isMockEnabled()) {
      return mockDriverService.updateLocation(payload);
    }
    try {
      await apiClient.post('/api/v1/drivers/me/location', {
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude),
        accuracy: typeof payload.accuracy === 'number' && !isNaN(payload.accuracy) ? Number(payload.accuracy) : 5,
      });
      return { success: true, timestamp: Date.now() };
    } catch {
      // Resilient handling: temporary network dropouts do not crash the app
      return { success: false, timestamp: Date.now() };
    }
  }

  /**
   * Retrieves administrative verification status
   * Uses real driver profile from backend when mock is disabled
   */
  async getVerificationStatus(driverId: string): Promise<{ status: VerificationStatus }> {
    if (isMockEnabled()) {
      return mockDriverService.getVerificationStatus(driverId);
    }
    try {
      const profile = await this.getProfile(driverId);
      const status =
        profile.verificationStatus || (profile.isVerified ? 'VERIFIED' : 'PENDING');
      return { status };
    } catch {
      return { status: 'NOT_SUBMITTED' };
    }
  }
}

export const driverService: IDriverService = new DriverService();
