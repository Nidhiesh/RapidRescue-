/**
 * TEMPORARY MOCK AUTHENTICATION SERVICE
 *
 * NOTE: This is a clearly marked mock implementation used exclusively
 * until the backend team finishes developing the FastAPI authentication contract.
 *
 * Strict Security Rules Enforced:
 * - Passwords are NEVER persisted to storage.
 * - Secure tokens are stored exclusively via expo-secure-store.
 * - Simulates realistic network latency, validation, and error states.
 */

import { IAuthService } from './auth.service.interface';
import { storageService, STORAGE_KEYS } from './storage.service';
import {
  LoginCredentials,
  RegisterPayload,
  AuthResponseData,
  PatientProfile,
} from '@/types/auth.types';
import { ApiError } from '@/types/api.types';

export class MockAuthService implements IAuthService {
  private delay(ms: number = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    await this.delay(700);

    const identifier = credentials.identifier.trim();

    // Testing trigger: Simulate Backend Unavailable
    if (identifier === '0000000000') {
      const error: ApiError = {
        statusCode: 503,
        message: 'FastAPI Backend service unavailable. Please try again shortly.',
        errorCode: 'BACKEND_UNAVAILABLE',
      };
      throw error;
    }

    // Testing trigger: Simulate Invalid Credentials
    if (credentials.password === 'wrong' || identifier === '9999999999') {
      const error: ApiError = {
        statusCode: 401,
        message: 'Invalid mobile number or credentials. Please check and retry.',
        errorCode: 'INVALID_CREDENTIALS',
      };
      throw error;
    }

    // Validation
    if (!identifier || identifier.length < 5) {
      const error: ApiError = {
        statusCode: 422,
        message: 'Please enter a valid mobile number or email address.',
        errorCode: 'VALIDATION_ERROR',
      };
      throw error;
    }

    // Check if we have an existing registered profile for this user
    let storedProfile: PatientProfile | null = null;
    try {
      const profileJson = await storageService.getItem(STORAGE_KEYS.PATIENT_PROFILE);
      if (profileJson) {
        storedProfile = JSON.parse(profileJson);
      }
    } catch {
      // Ignore parse error
    }

    const patient: PatientProfile = storedProfile ?? {
      id: 'patient-mock-101',
      name: 'John Doe',
      phone: identifier.startsWith('+') ? identifier : `+91 ${identifier}`,
      email: identifier.includes('@') ? identifier : 'john.doe@example.com',
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Sarah Doe',
        relationship: 'Spouse',
        phone: '+91 9876543210',
      },
      createdAt: new Date().toISOString(),
    };

    const tokens = {
      accessToken: `mock_jwt_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    // Securely persist token and profile (NEVER passwords)
    await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
    await storageService.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(patient));

    return { patient, tokens };
  }

  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    await this.delay(800);

    const name = payload.name.trim();
    const phone = payload.phone.trim();

    if (!name || name.length < 2) {
      const error: ApiError = {
        statusCode: 422,
        message: 'Full name is required (minimum 2 characters).',
        errorCode: 'VALIDATION_ERROR',
      };
      throw error;
    }

    if (!phone || phone.length < 8) {
      const error: ApiError = {
        statusCode: 422,
        message: 'A valid mobile number is required for emergency dispatch.',
        errorCode: 'VALIDATION_ERROR',
      };
      throw error;
    }

    const patient: PatientProfile = {
      id: `patient-mock-${Date.now()}`,
      name,
      phone: phone.startsWith('+') ? phone : `+91 ${phone}`,
      email: payload.email?.trim() || undefined,
      bloodGroup: payload.bloodGroup || 'Unknown',
      emergencyContact: payload.emergencyContactName
        ? {
            name: payload.emergencyContactName.trim(),
            relationship: payload.emergencyContactRelation?.trim() || 'Emergency Contact',
            phone: payload.emergencyContactPhone?.trim() || '',
          }
        : undefined,
      createdAt: new Date().toISOString(),
    };

    const tokens = {
      accessToken: `mock_jwt_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };

    // Securely persist token and profile (NEVER passwords)
    await storageService.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
    await storageService.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(patient));

    return { patient, tokens };
  }

  async restoreSession(): Promise<PatientProfile | null> {
    await this.delay(400);

    const token = await storageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return null;
    }

    // Testing trigger: Simulate Expired Token
    if (token === 'expired_token') {
      await storageService.clearAll();
      return null;
    }

    const profileJson = await storageService.getItem(STORAGE_KEYS.PATIENT_PROFILE);
    if (!profileJson) {
      return null;
    }

    try {
      const profile = JSON.parse(profileJson) as PatientProfile;
      return profile;
    } catch {
      await storageService.clearAll();
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.delay(300);
    await storageService.clearAll();
  }
}

export const mockAuthService = new MockAuthService();
export default mockAuthService;
