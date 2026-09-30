/**
 * RapidRescue Driver Mobile App - Admin Authentication Service Abstraction
 */

import { AdminCredentials, AdminAuthResponse, AdminSession } from '../../types';
import { mockAdminAuthService } from './mockAdminAuthService';

export interface IAdminAuthService {
  login(credentials: AdminCredentials): Promise<AdminAuthResponse>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AdminSession | null>;
}

export const adminAuthService: IAdminAuthService = mockAdminAuthService;

export * from './mockAdminAuthService';
