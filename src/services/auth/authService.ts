/**
 * RapidRescue Driver Mobile App - Authentication Service Abstraction Layer
 * Routes auth requests through a modular interface ready for FastAPI integration.
 */

import { AuthResponse, AuthSession, LoginCredentials, DriverRegistrationData } from '../../types';
import { mockAuthService } from './mockAuthService';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: DriverRegistrationData): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}

// Active service implementation (defaults to mockAuthService until backend integration)
export const authService: IAuthService = mockAuthService;

export * from './mockAuthService';
