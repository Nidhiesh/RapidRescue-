/**
 * RapidRescue FastAPI Authentication Service Adapter
 *
 * Real API integration communicating with the FastAPI backend.
 * Integrates directly with apiClient and handles standard HTTP/FastAPI errors.
 */

import { IAuthService } from './auth.service.interface';
import { storageService, STORAGE_KEYS } from './storage.service';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import {
  LoginCredentials,
  RegisterPayload,
  AuthResponseData,
  PatientProfile,
  AuthTokens,
} from '@/types/auth.types';
import { ApiError } from '@/types/api.types';

export class ApiAuthService implements IAuthService {
  constructor() {
    // Hook up token provider so all authenticated apiClient calls automatically inject Bearer token
    apiClient.setTokenProvider(async () => {
      return await storageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    try {
      const response = await apiClient.post<AuthResponseData>(
        ENDPOINTS.AUTH.LOGIN,
        {
          identifier: credentials.identifier.trim(),
          password: credentials.password,
          otp: credentials.otp,
        },
        { requiresAuth: false }
      );

      const { patient, tokens } = response.data;

      // Securely persist tokens & profile (NEVER passwords)
      if (tokens?.accessToken) {
        await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
        if (tokens.refreshToken) {
          await storageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
        }
      }
      if (patient) {
        await storageService.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(patient));
      }

      return response.data;
    } catch (error: unknown) {
      const apiErr = error as ApiError;
      if (apiErr.statusCode === 401) {
        throw {
          ...apiErr,
          message: 'Invalid credentials. Please verify your mobile number or password.',
        } as ApiError;
      }
      throw error;
    }
  }

  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    try {
      const response = await apiClient.post<AuthResponseData>(
        ENDPOINTS.AUTH.REGISTER,
        payload,
        { requiresAuth: false }
      );

      const { patient, tokens } = response.data;

      if (tokens?.accessToken) {
        await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
        if (tokens.refreshToken) {
          await storageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
        }
      }
      if (patient) {
        await storageService.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(patient));
      }

      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async restoreSession(): Promise<PatientProfile | null> {
    const token = await storageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return null;
    }

    try {
      // Validate session with backend
      const response = await apiClient.get<PatientProfile>(ENDPOINTS.AUTH.PROFILE);
      const patient = response.data;
      await storageService.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(patient));
      return patient;
    } catch (error: unknown) {
      const apiErr = error as ApiError;
      // If token expired or rejected by backend (401), clean up
      if (apiErr.statusCode === 401 || apiErr.statusCode === 403) {
        await storageService.clearAll();
        return null;
      }

      // If backend is temporarily offline, attempt cached profile if available
      const cachedProfileJson = await storageService.getItem(STORAGE_KEYS.PATIENT_PROFILE);
      if (cachedProfileJson) {
        try {
          return JSON.parse(cachedProfileJson) as PatientProfile;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {}, { requiresAuth: true }).catch(() => {
        // Continue clearing local storage even if network request fails
      });
    } finally {
      await storageService.clearAll();
    }
  }
}

export const apiAuthService = new ApiAuthService();
export default apiAuthService;
