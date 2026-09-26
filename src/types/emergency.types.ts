/**
 * RapidRescue Emergency Lifecycle Types
 */

export enum EmergencyStatus {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  CONFIRMING = 'CONFIRMING',
  SEARCHING = 'SEARCHING',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface EmergencyCaptureData {
  frontPhotoUri: string;
  rearPhotoUri: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  address?: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface LocationAddress {
  formattedAddress?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface EmergencyLocation {
  coords: GeoCoordinates;
  address?: LocationAddress;
}

export interface CapturedEmergencyPhoto {
  uri: string;
  base64?: string;
  width?: number;
  height?: number;
  timestamp: string;
}

export interface EmergencyRequestPayload {
  patientId: string;
  latitude: number;
  longitude: number;
  address?: string;
  severityNotes?: string;
  photoUri?: string;
  photoBase64?: string;
}

export interface EmergencyRecord {
  id: string;
  patientId: string;
  status: EmergencyStatus;
  location: EmergencyLocation;
  photoUrl?: string;
  assignedAmbulanceId?: string;
  assignedDriverId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
