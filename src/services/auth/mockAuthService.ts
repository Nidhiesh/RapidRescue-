/**
 * RapidRescue Driver Mobile App - Mock Authentication Service
 * Simulates authentication logic, network latency, and validation for local development
 * until Ravin's FastAPI backend is connected.
 */

import { AuthResponse, AuthSession, LoginCredentials, DriverRegistrationData } from '../../types';

// Pre-seeded development-only mock driver account
export const MOCK_DRIVER_CREDENTIALS = {
  mobileNumber: '9876543210',
  password: 'Password@123',
  name: 'Gokul (Driver)',
  email: 'gokul.driver@rapidrescue.org',
  yearsOfExperience: 5,
};

let currentActiveSession: AuthSession | null = null;

// Simulated network latency
const simulateNetworkDelay = (ms: number = 750): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  /**
   * Mock driver login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await simulateNetworkDelay();

    const normalizedMobile = credentials.mobileNumber.replace(/\s+/g, '').replace(/[-+]/g, '');
    const cleanMockMobile = MOCK_DRIVER_CREDENTIALS.mobileNumber;

    // Check if credentials match mock driver
    if (
      normalizedMobile.endsWith(cleanMockMobile) &&
      credentials.password === MOCK_DRIVER_CREDENTIALS.password
    ) {
      const session: AuthSession = {
        driverId: 'RR-DRV-1001',
        name: MOCK_DRIVER_CREDENTIALS.name,
        mobileNumber: MOCK_DRIVER_CREDENTIALS.mobileNumber,
        email: MOCK_DRIVER_CREDENTIALS.email,
        yearsOfExperience: MOCK_DRIVER_CREDENTIALS.yearsOfExperience,
        token: `mock_jwt_token_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isMockSession: true,
      };

      currentActiveSession = session;

      return {
        success: true,
        session,
        message: 'Login successful. Welcome back, Gokul!',
      };
    }

    return {
      success: false,
      error: 'Invalid mobile number or password. Check mock credentials.',
    };
  },

  /**
   * Mock driver registration
   */
  async register(data: DriverRegistrationData): Promise<AuthResponse> {
    await simulateNetworkDelay(900);

    // Basic server-side simulation checks
    if (!data.fullName.trim() || !data.mobileNumber.trim()) {
      return {
        success: false,
        error: 'Registration failed: Missing required fields.',
      };
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const driverId = data.driverIdPlaceholder.trim()
      ? data.driverIdPlaceholder.trim()
      : `RR-DRV-${randomId}`;

    const session: AuthSession = {
      driverId,
      name: data.fullName.trim(),
      mobileNumber: data.mobileNumber.trim(),
      email: data.email.trim(),
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      token: `mock_jwt_token_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isMockSession: true,
    };

    currentActiveSession = session;

    return {
      success: true,
      session,
      message: 'Driver registration submitted successfully.',
    };
  },

  /**
   * Mock driver logout
   */
  async logout(): Promise<void> {
    await simulateNetworkDelay(300);
    currentActiveSession = null;
  },

  /**
   * Retrieve active mock session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    return currentActiveSession;
  },
};
