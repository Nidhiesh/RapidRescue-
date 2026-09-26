/**
 * RapidRescue Auth Types
 *
 * Strongly typed models for patient profile, authentication requests,
 * session lifecycle states, and security tokens.
 */

export type AuthStatus =
  | 'restoring_session'
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'error';

export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  emergencyContact?: EmergencyContact;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface AuthResponseData {
  patient: PatientProfile;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  identifier: string; // Mobile number or email
  password?: string;
  otp?: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface AuthState {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: PatientProfile | null;
  error: string | null;
}
