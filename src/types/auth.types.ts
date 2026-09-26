/**
 * RapidRescue Auth Types
 */

export interface EmergencyContact {
  id: string;
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
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContacts?: EmergencyContact[];
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: PatientProfile | null;
  tokens: AuthTokens | null;
  error: string | null;
}
