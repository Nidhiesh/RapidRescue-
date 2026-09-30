/**
 * RapidRescue Driver Mobile App - Mock Authentication Service
 * Unified Authentication Service for Drivers and Dispatch Administrators
 * Simulates authentication logic, network latency, and validation for local development
 * until Ravin's FastAPI backend is connected.
 */

import { AuthResponse, AuthSession, LoginCredentials, DriverRegistrationData, AdminSession } from '../../types';
import { DEMO_ADMIN_CREDENTIALS, mockAdminAuthService } from '../admin/mockAdminAuthService';

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
const simulateNetworkDelay = (ms: number = 700): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  /**
   * Unified Login for Driver and Admin roles
   * Evaluates credentials to determine whether the user is a Driver or Admin.
   * Does NOT store passwords in the returned session object.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await simulateNetworkDelay();

    const normalizedMobile = credentials.mobileNumber.replace(/\s+/g, '').replace(/[-+]/g, '');
    const cleanDriverMobile = MOCK_DRIVER_CREDENTIALS.mobileNumber;
    const cleanAdminMobile = DEMO_ADMIN_CREDENTIALS.mobileNumber;

    // 1. Check for Admin Credentials
    if (
      normalizedMobile.endsWith(cleanAdminMobile) &&
      credentials.password === DEMO_ADMIN_CREDENTIALS.password
    ) {
      const adminSession: AdminSession = {
        role: 'ADMIN',
        userId: DEMO_ADMIN_CREDENTIALS.adminId,
        adminId: DEMO_ADMIN_CREDENTIALS.adminId,
        name: DEMO_ADMIN_CREDENTIALS.name,
        displayName: 'Dispatch Admin',
        mobileNumber: DEMO_ADMIN_CREDENTIALS.mobileNumber,
        token: `mock_admin_jwt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isMockSession: true,
      };

      currentActiveSession = adminSession;
      mockAdminAuthService.setSession(adminSession);

      return {
        success: true,
        session: adminSession,
        message: 'Admin authorization granted.',
      };
    }

    // 2. Check for Driver Credentials
    if (
      normalizedMobile.endsWith(cleanDriverMobile) &&
      credentials.password === MOCK_DRIVER_CREDENTIALS.password
    ) {
      const driverSession: AuthSession = {
        role: 'DRIVER',
        userId: 'RR-DRV-1001',
        driverId: 'RR-DRV-1001',
        name: MOCK_DRIVER_CREDENTIALS.name,
        displayName: 'Gokul',
        mobileNumber: MOCK_DRIVER_CREDENTIALS.mobileNumber,
        email: MOCK_DRIVER_CREDENTIALS.email,
        yearsOfExperience: MOCK_DRIVER_CREDENTIALS.yearsOfExperience,
        token: `mock_driver_jwt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        isMockSession: true,
      };

      currentActiveSession = driverSession;

      return {
        success: true,
        session: driverSession,
        message: 'Driver login successful. Welcome back!',
      };
    }

    return {
      success: false,
      error: 'Invalid mobile number or password. Please check your credentials.',
    };
  },

  /**
   * Mock driver registration
   */
  async register(data: DriverRegistrationData): Promise<AuthResponse> {
    await simulateNetworkDelay(900);

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
      role: 'DRIVER',
      userId: driverId,
      driverId,
      name: data.fullName.trim(),
      displayName: data.fullName.trim().split(' ')[0],
      mobileNumber: data.mobileNumber.trim(),
      email: data.email.trim(),
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      token: `mock_driver_jwt_${Date.now()}`,
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
   * Unified logout
   */
  async logout(): Promise<void> {
    await simulateNetworkDelay(250);
    currentActiveSession = null;
    await mockAdminAuthService.logout();
  },

  /**
   * Retrieve active session
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    return currentActiveSession;
  },
};
