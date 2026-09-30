/**
 * RapidRescue Driver Mobile App - Mock Admin Authentication Service
 * Dedicated authentication and session handler for RapidRescue dispatch administrators.
 */

import { AdminCredentials, AdminAuthResponse, AdminSession } from '../../types';

export const DEMO_ADMIN_CREDENTIALS = {
  mobileNumber: '9999999999',
  password: 'Admin@123',
  adminId: 'RR-ADM-001',
  name: 'RapidRescue Dispatch Admin',
};

let currentAdminSession: AdminSession | null = null;

const delay = (ms: number = 600): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockAdminAuthService = {
  /**
   * Admin login
   */
  async login(credentials: AdminCredentials): Promise<AdminAuthResponse> {
    await delay(650);

    const cleanInputMobile = credentials.mobileNumber.replace(/\s+/g, '').replace(/[-+]/g, '');
    const cleanAdminMobile = DEMO_ADMIN_CREDENTIALS.mobileNumber;

    if (
      cleanInputMobile.endsWith(cleanAdminMobile) &&
      credentials.password === DEMO_ADMIN_CREDENTIALS.password
    ) {
      const session: AdminSession = {
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

      currentAdminSession = session;

      return {
        success: true,
        session,
        message: 'Admin authorization granted.',
      };
    }

    return {
      success: false,
      error: 'Invalid administrator credentials. Please check demo values.',
    };
  },

  /**
   * Admin logout
   */
  async logout(): Promise<void> {
    await delay(200);
    currentAdminSession = null;
  },

  /**
   * Retrieve active admin session
   */
  async getCurrentSession(): Promise<AdminSession | null> {
    return currentAdminSession;
  },

  /**
   * Set active admin session directly (for unified auth sync)
   */
  setSession(session: AdminSession | null): void {
    currentAdminSession = session;
  },
};
