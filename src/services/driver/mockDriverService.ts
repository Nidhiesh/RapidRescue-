/**
 * RapidRescue Driver Mobile App - Mock Driver Service
 * In-memory client service implementation simulating driver profile management,
 * duty status toggles, availability transitions, and location synchronization.
 */

import {
  DriverProfile,
  DriverLocationUpdatePayload,
  IDriverService,
  DriverDutyStatus,
  DriverAvailability,
  VerificationStatus,
} from '../../types';

let mockProfileState: DriverProfile = {
  id: 'RR-DRV-1001',
  fullName: 'Gokul (Driver)',
  mobileNumber: '9876543210',
  email: 'gokul.driver@rapidrescue.org',
  yearsOfExperience: 5,
  isVerified: true,
  dutyStatus: 'OFFLINE',
  availability: 'UNAVAILABLE',
};

let lastKnownLocation: DriverLocationUpdatePayload | null = null;

export const mockDriverService: IDriverService = {
  /**
   * Retrieves active driver profile
   */
  async getProfile(driverId?: string): Promise<DriverProfile> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      ...mockProfileState,
      id: driverId || mockProfileState.id,
    };
  },

  /**
   * Updates shift duty status (ONLINE / OFFLINE)
   */
  async updateDutyStatus(
    _driverId: string,
    status: DriverDutyStatus,
    _location?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<{
    success: boolean;
    dutyStatus: DriverDutyStatus;
    availability?: DriverAvailability;
    error?: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    mockProfileState.dutyStatus = status;
    if (status === 'OFFLINE') {
      mockProfileState.availability = 'UNAVAILABLE';
    } else {
      mockProfileState.availability = 'AVAILABLE';
    }
    return {
      success: true,
      dutyStatus: status,
      availability: mockProfileState.availability,
    };
  },

  /**
   * Updates dispatch availability (AVAILABLE / UNAVAILABLE / BUSY)
   */
  async updateAvailability(
    _driverId: string,
    availability: DriverAvailability
  ): Promise<{
    success: boolean;
    availability: DriverAvailability;
    error?: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    mockProfileState.availability = availability;
    return { success: true, availability };
  },

  /**
   * Updates driver GPS position
   */
  async updateLocation(
    payload: DriverLocationUpdatePayload
  ): Promise<{ success: boolean; timestamp: number }> {
    lastKnownLocation = payload;
    return { success: true, timestamp: payload.timestamp };
  },

  /**
   * Retrieves administrative verification status
   */
  async getVerificationStatus(_driverId: string): Promise<{ status: VerificationStatus }> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { status: mockProfileState.isVerified ? 'VERIFIED' : 'PENDING' };
  },
};

/**
 * Accessor for last recorded telemetry in mock mode (useful for testing)
 */
export const getMockLastKnownLocation = (): DriverLocationUpdatePayload | null => {
  return lastKnownLocation;
};
