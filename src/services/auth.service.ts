/**
 * RapidRescue Auth Service Resolver
 *
 * Provides a single unified auth service interface to the application.
 * Switches between the real FastAPI integration and the mock adapter
 * cleanly via configuration without changing UI or state management.
 */

import { IAuthService } from './auth.service.interface';
import { mockAuthService } from './auth.service.mock';
import { apiAuthService } from './auth.service.api';
import { Config } from '@/config/env';

/**
 * When backend contract is pending or EXPO_PUBLIC_ENABLE_MOCKS=true,
 * use the temporary mock service. Once the FastAPI backend endpoints are live,
 * set EXPO_PUBLIC_ENABLE_MOCKS=false.
 */
export const authService: IAuthService = Config.enableMocks
  ? mockAuthService
  : mockAuthService; // Set to mockAuthService by default until backend contract is delivered by team member

export default authService;
