/**
 * RapidRescue Driver Mobile App - Authentication Types
 */

export type AuthStatus = 'UNAUTHENTICATED' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'ERROR';

export interface LoginCredentials {
  mobileNumber: string;
  password: string;
}

export interface AuthSession {
  driverId: string;
  name: string;
  mobileNumber: string;
  email: string;
  yearsOfExperience?: number;
  token: string;
  createdAt: string;
  isMockSession: boolean;
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
