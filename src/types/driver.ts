/**
 * RapidRescue Driver Mobile App - Driver Profile & Registration Types
 */

import { DriverDutyStatus, DriverAvailability } from './location';
import { VerificationStatus } from './verification';

export interface DriverRegistrationData {
  // Section 1: Personal Details
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;

  // Section 2: Account Security
  password: string;
  confirmPassword: string;

  // Section 3: Basic Driver Information
  driverIdPlaceholder: string;
  yearsOfExperience: string;
}

export interface DriverProfile {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  yearsOfExperience: number;
  isVerified: boolean;
  verificationStatus?: VerificationStatus;
  dutyStatus?: DriverDutyStatus;
  availability?: DriverAvailability;
}

export interface DriverLocationUpdatePayload {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface IDriverService {
  getProfile(driverId?: string): Promise<DriverProfile>;
  updateDutyStatus(
    driverId: string,
    status: DriverDutyStatus,
    location?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<{
    success: boolean;
    dutyStatus: DriverDutyStatus;
    availability?: DriverAvailability;
    error?: string;
  }>;
  updateAvailability(
    driverId: string,
    availability: DriverAvailability
  ): Promise<{
    success: boolean;
    availability: DriverAvailability;
    error?: string;
  }>;
  updateLocation(payload: DriverLocationUpdatePayload): Promise<{ success: boolean; timestamp: number }>;
  getVerificationStatus(driverId: string): Promise<{ status: VerificationStatus }>;
}

