/**
 * RapidRescue Tracking & Driver Types
 */

import { GeoCoordinates } from './emergency.types';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  rating?: number;
}

export interface AmbulanceVehicle {
  id: string;
  vehicleNumber: string;
  model: string;
  type: 'BASIC_LIFE_SUPPORT' | 'ADVANCED_LIFE_SUPPORT' | 'PATIENT_TRANSPORT';
}

export interface LiveTelemetry {
  ambulanceId: string;
  driverId: string;
  currentLocation: GeoCoordinates;
  etaMinutes: number;
  distanceKm: number;
  bearingDeg?: number;
  speedKmh?: number;
  lastUpdated: string;
}

export interface ActiveDispatch {
  emergencyId: string;
  driver: DriverProfile;
  ambulance: AmbulanceVehicle;
  telemetry: LiveTelemetry;
}
