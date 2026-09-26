/**
 * RapidRescue Driver Mobile App - Core Constants
 */
export const APP_CONFIG = {
  appName: 'RapidRescue',
  moduleName: 'Driver App',
  tagline: 'Emergency Ambulance Response',
  version: '1.0.0',
  description:
    'Dedicated portal for verified ambulance drivers to receive, assess, and rapidly respond to critical emergency dispatch requests.',
  apiTimeoutMs: 15000,
} as const;

export const STORAGE_KEYS = {
  authToken: '@rapidrescue_driver_auth_token',
  driverProfile: '@rapidrescue_driver_profile',
} as const;
