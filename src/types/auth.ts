/**
 * RapidRescue Driver Mobile App - Authentication Types
 * Unified Role-Aware Authentication Models (Driver & Admin)
 */

import { VerificationStatus } from './verification';
import { DriverDutyStatus, DriverAvailability } from './location';

export type UserRole = 'DRIVER' | 'ADMIN';

export type AuthStatus =
  | 'INITIALIZING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'ERROR';

export interface LoginCredentials {
  mobileNumber: string;
  password: string;
}

export interface BaseSession {
  userId: string;
  role: UserRole;
  name: string;
  displayName: string;
  mobileNumber: string;
  token: string;
  createdAt: string;
  isMockSession: boolean;
  driverId?: string;
  adminId?: string;
}

export interface DriverSession extends BaseSession {
  role: 'DRIVER';
  driverId: string;
  email: string;
  fullName?: string;
  yearsOfExperience?: number;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  dutyStatus?: DriverDutyStatus;
  availability?: DriverAvailability;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

export interface AdminSession extends BaseSession {
  role: 'ADMIN';
  adminId: string;
}

export type AuthSession = DriverSession | AdminSession;

export interface AdminCredentials {
  mobileNumber: string;
  password: string;
}

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
  isLoading: boolean;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSession;
  error?: string;
  message?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  session?: AdminSession;
  error?: string;
  message?: string;
}
