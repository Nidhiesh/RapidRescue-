/**
 * RapidRescue Location Types (Phase 3)
 *
 * Typed models for GPS permission, location capture, and reverse geocoding result.
 */

export type LocationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

export type LocationAccuracyLevel = 'high' | 'acceptable' | 'low';

/**
 * The primary GPS capture result.
 * Latitude and longitude are always the authoritative data.
 * Address is supplementary — the emergency flow must proceed even if it is unavailable.
 */
export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitudeMeters: number | null;
  timestamp: string;
  accuracyLevel: LocationAccuracyLevel;
}

export interface ReverseGeocodedAddress {
  formattedAddress: string;
  street: string | null;
  district: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
}

export type LocationError =
  | 'PERMISSION_DENIED'
  | 'GPS_DISABLED'
  | 'LOCATION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface LocationSuccess {
  success: true;
  location: CapturedLocation;
  address: ReverseGeocodedAddress | null;
}

export interface LocationFailure {
  success: false;
  error: LocationError;
  message: string;
}

export type LocationOutcome = LocationSuccess | LocationFailure;
