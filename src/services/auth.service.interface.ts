/**
 * RapidRescue Auth Service Interface
 *
 * Strict contract defining authentication capabilities.
 * Decouples the UI and state management from backend implementation details.
 */

import {
  LoginCredentials,
  RegisterPayload,
  AuthResponseData,
  PatientProfile,
} from '@/types/auth.types';

export interface IAuthService {
  /**
   * Authenticate an existing patient with mobile/email and credentials
   */
  login(credentials: LoginCredentials): Promise<AuthResponseData>;

  /**
   * Register a new patient profile
   */
  register(payload: RegisterPayload): Promise<AuthResponseData>;

  /**
   * Validate existing secure session on app startup and restore patient profile
   */
  restoreSession(): Promise<PatientProfile | null>;

  /**
   * Terminate patient session and clear secure storage
   */
  logout(): Promise<void>;
}
