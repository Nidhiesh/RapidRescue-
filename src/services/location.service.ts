/**
 * RapidRescue Location Service (Phase 3)
 *
 * Encapsulates all GPS and reverse geocoding logic:
 * - Permission request and status check
 * - Single high-accuracy location capture (not continuous tracking)
 * - Reverse geocoding to produce a human-readable address (supplementary only)
 *
 * Screens and hooks must NOT call Location APIs directly.
 * All location logic lives here.
 */

import * as ExpoLocation from 'expo-location';
import {
  CapturedLocation,
  LocationPermissionStatus,
  LocationAccuracyLevel,
  ReverseGeocodedAddress,
  LocationError,
  LocationOutcome,
} from '@/types/location.types';

/** Minimum acceptable GPS accuracy in metres */
const ACCEPTABLE_ACCURACY_METRES = 100;
/** High accuracy threshold in metres */
const HIGH_ACCURACY_METRES = 30;

class LocationService {
  /**
   * Returns the current foreground location permission status without prompting.
   */
  async checkPermission(): Promise<LocationPermissionStatus> {
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    if (status === ExpoLocation.PermissionStatus.GRANTED) return 'granted';
    if (status === ExpoLocation.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  }

  /**
   * Requests foreground location permission from the OS.
   */
  async requestPermission(): Promise<LocationPermissionStatus> {
    const { granted } = await ExpoLocation.requestForegroundPermissionsAsync();
    return granted ? 'granted' : 'denied';
  }

  /**
   * Captures the patient's current GPS position once.
   * Uses HIGH accuracy with a 15 second timeout.
   * Does NOT start continuous tracking.
   */
  async captureCurrentLocation(): Promise<LocationOutcome> {
    try {
      const permStatus = await this.checkPermission();
      if (permStatus !== 'granted') {
        return {
          success: false,
          error: 'PERMISSION_DENIED',
          message:
            'Location access was denied. Please enable it in your device Settings to dispatch emergency services to you.',
        };
      }

      // Check if location services (GPS) are enabled on device
      const isEnabled = await ExpoLocation.hasServicesEnabledAsync();
      if (!isEnabled) {
        return {
          success: false,
          error: 'GPS_DISABLED',
          message:
            'Location services (GPS) are disabled. Please turn on GPS in your device Settings.',
        };
      }

      const expoLocation = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 0,
      });

      const coords = expoLocation.coords;
      const accuracyMetres = coords.accuracy ?? 9999;

      const accuracyLevel: LocationAccuracyLevel =
        accuracyMetres <= HIGH_ACCURACY_METRES
          ? 'high'
          : accuracyMetres <= ACCEPTABLE_ACCURACY_METRES
          ? 'acceptable'
          : 'low';

      const location: CapturedLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? null,
        altitudeMeters: coords.altitude ?? null,
        timestamp: new Date(expoLocation.timestamp).toISOString(),
        accuracyLevel,
      };

      const address = await this.reverseGeocode(coords.latitude, coords.longitude);

      return { success: true, location, address };
    } catch (error: unknown) {
      const msg = (error as Error).message ?? '';

      if (
        msg.includes('timed out') ||
        msg.includes('timeout') ||
        msg.toLowerCase().includes('time limit')
      ) {
        return {
          success: false,
          error: 'TIMEOUT',
          message:
            'Location request timed out. Please ensure you are in an area with GPS signal and try again.',
        };
      }

      if (
        msg.includes('Location services are disabled') ||
        msg.includes('LocationServicesDisabled')
      ) {
        return {
          success: false,
          error: 'GPS_DISABLED',
          message: 'Location services (GPS) are disabled. Please enable GPS and try again.',
        };
      }

      return {
        success: false,
        error: 'LOCATION_UNAVAILABLE',
        message: 'Unable to retrieve GPS location. Please try again.',
      };
    }
  }

  /**
   * Reverse geocodes GPS coordinates to a human-readable address.
   * This is supplementary — failure must NOT block the emergency flow.
   * Returns null on any failure.
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodedAddress | null> {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync(
        { latitude, longitude }
      );

      if (!results || results.length === 0) return null;

      const r = results[0];

      // Build a formatted address string from available parts
      const parts = [
        r.streetNumber && r.street ? `${r.streetNumber} ${r.street}` : r.street,
        r.district,
        r.city,
        r.region,
        r.postalCode,
        r.country,
      ].filter(Boolean);

      return {
        formattedAddress: parts.join(', '),
        street: r.street ?? null,
        district: r.district ?? null,
        city: r.city ?? null,
        region: r.region ?? null,
        postalCode: r.postalCode ?? null,
        country: r.country ?? null,
      };
    } catch {
      // Reverse geocoding is supplementary — fail silently
      return null;
    }
  }

  /**
   * Helper: returns a formatted accuracy label for the UI.
   */
  formatAccuracy(accuracy: number | null): string {
    if (accuracy === null) return 'Unknown';
    return `±${Math.round(accuracy)} m`;
  }

  /**
   * Helper: format GPS coords for display.
   */
  formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
}

export const locationService = new LocationService();

/**
 * Human-readable error message lookup for location errors.
 */
export function getLocationErrorMessage(error: LocationError): string {
  switch (error) {
    case 'PERMISSION_DENIED':
      return 'Location access denied. Please enable it in device Settings to dispatch ambulance.';
    case 'GPS_DISABLED':
      return 'GPS is turned off. Please enable Location Services and try again.';
    case 'TIMEOUT':
      return 'Location timed out. Move outdoors or try again in a moment.';
    case 'LOCATION_UNAVAILABLE':
      return 'Location unavailable. Please check your GPS signal.';
    case 'UNKNOWN':
      return 'An unexpected location error occurred. Please try again.';
  }
}

export default locationService;
