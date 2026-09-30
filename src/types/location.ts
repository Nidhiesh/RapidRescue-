/**
 * RapidRescue Driver Mobile App - Location & Duty State Models
 */

export type DriverDutyStatus = 'OFFLINE' | 'ONLINE';

export type DriverAvailability = 'UNAVAILABLE' | 'AVAILABLE' | 'BUSY';

export type LocationTrackingStatus =
  | 'INACTIVE'
  | 'REQUESTING_PERMISSION'
  | 'ACTIVE'
  | 'PERMISSION_DENIED'
  | 'SERVICES_DISABLED'
  | 'ERROR';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationServiceError {
  code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}
