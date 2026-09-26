/**
 * RapidRescue API Endpoints
 *
 * Centralized registry of all REST API endpoints.
 * This ensures no hardcoded URL strings appear across screens or services.
 */

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
  },

  // Emergency Lifecycle
  EMERGENCY: {
    REQUEST: '/emergency/request',
    DETAILS: (id: string) => `/emergency/${id}`,
    STATUS: (id: string) => `/emergency/${id}/status`,
    CANCEL: (id: string) => `/emergency/${id}/cancel`,
    HISTORY: '/emergency/history',
  },

  // Driver & Ambulance Tracking
  TRACKING: {
    AMBULANCE_LOCATION: (id: string) => `/tracking/ambulance/${id}/location`,
    DRIVER_DETAILS: (id: string) => `/tracking/driver/${id}`,
  },

  // System
  SYSTEM: {
    HEALTH: '/health',
  },
} as const;

export default ENDPOINTS;
