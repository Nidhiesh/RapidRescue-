/**
 * RapidRescue Driver Mobile App - Authentication Service Abstraction Layer
 * Routes auth requests through a modular interface ready for FastAPI integration.
 */

import { AuthResponse, AuthSession, LoginCredentials, DriverRegistrationData } from '../../types';
import { isMockEnabled } from '../../config/apiConfig';
import { mockAuthService } from './mockAuthService';
import { realAuthService } from './realAuthService';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: DriverRegistrationData): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}

class AuthService implements IAuthService {
  /**
   * Driver and Admin Login:
   * Uses real FastAPI backend when EXPO_PUBLIC_USE_MOCK_SERVICES=false.
   * Retains mockAuthService for development/testing when true.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (isMockEnabled()) {
      return mockAuthService.login(credentials);
    }
    return realAuthService.login(credentials);
  }

  /**
   * Driver Registration:
   * Uses real FastAPI backend when EXPO_PUBLIC_USE_MOCK_SERVICES=false.
   * Retains mockAuthService for development/testing when true.
   */
  async register(data: DriverRegistrationData): Promise<AuthResponse> {
    if (isMockEnabled()) {
      return mockAuthService.register(data);
    }
    return realAuthService.register(data);
  }

  /**
   * Session Termination
   */
  async logout(): Promise<void> {
    if (isMockEnabled()) {
      return mockAuthService.logout();
    }
    return realAuthService.logout();
  }

  /**
   * Session Retrieval and Rehydration
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    if (isMockEnabled()) {
      return mockAuthService.getCurrentSession();
    }
    return realAuthService.getCurrentSession();
  }
}

// Active service proxy respecting EXPO_PUBLIC_USE_MOCK_SERVICES
export const authService: IAuthService = new AuthService();

export * from './mockAuthService';
export * from './realAuthService';

