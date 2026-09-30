/**
 * RapidRescue Driver Mobile App - Location Service
 * Abstraction wrapping Expo Location APIs for foreground GPS tracking.
 */

import * as Location from 'expo-location';
import { DriverLocation, LocationServiceError } from '../../types';

export interface ILocationService {
  requestLocationPermission(): Promise<boolean>;
  getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
  isLocationServicesEnabled(): Promise<boolean>;
  getCurrentLocation(): Promise<DriverLocation>;
  startLocationTracking(
    onLocation: (location: DriverLocation) => void,
    onError: (err: LocationServiceError) => void
  ): Promise<() => void>;
  getLastKnownLocation(): Promise<DriverLocation | null>;
}

export const locationService: ILocationService = {
  /**
   * Request foreground location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      return false;
    }
  },

  /**
   * Check current permission status
   */
  async getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'undetermined';
    } catch (err) {
      return 'undetermined';
    }
  },

  /**
   * Check if hardware location provider is switched on
   */
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (err) {
      return false;
    }
  },

  /**
   * Acquire a one-shot current location
   */
  async getCurrentLocation(): Promise<DriverLocation> {
    const isServicesEnabled = await this.isLocationServicesEnabled();
    if (!isServicesEnabled) {
      throw {
        code: 'SERVICES_DISABLED',
        message: 'Device location services (GPS) are turned off. Please turn them on in device settings.',
      } as LocationServiceError;
    }

    const isGranted = await this.requestLocationPermission();
    if (!isGranted) {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Location permission was denied. Location is required for emergency dispatch readiness.',
      } as LocationServiceError;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        altitude: position.coords.altitude ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      };
    } catch (err) {
      throw {
        code: 'TIMEOUT',
        message: 'Unable to acquire satellite GPS fix. Please ensure you have a clear sky view.',
      } as LocationServiceError;
    }
  },

  /**
   * Start continuous location updates with cleanup unsubscription
   */
  async startLocationTracking(
    onLocation: (location: DriverLocation) => void,
    onError: (err: LocationServiceError) => void
  ): Promise<() => void> {
    const isServicesEnabled = await this.isLocationServicesEnabled();
    if (!isServicesEnabled) {
      onError({
        code: 'SERVICES_DISABLED',
        message: 'Location services are disabled on device.',
      });
      return () => {};
    }

    const isGranted = await this.requestLocationPermission();
    if (!isGranted) {
      onError({
        code: 'PERMISSION_DENIED',
        message: 'Location permission denied.',
      });
      return () => {};
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 5,
        },
        (loc) => {
          onLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
            altitude: loc.coords.altitude ?? undefined,
            heading: loc.coords.heading ?? undefined,
            speed: loc.coords.speed ?? undefined,
            timestamp: loc.timestamp,
          });
        }
      );

      return () => {
        subscription.remove();
      };
    } catch (err) {
      onError({
        code: 'UNKNOWN',
        message: 'Failed to start location subscription.',
      });
      return () => {};
    }
  },

  /**
   * Fetch last known cached position
   */
  async getLastKnownLocation(): Promise<DriverLocation | null> {
    try {
      const position = await Location.getLastKnownPositionAsync();
      if (!position) return null;
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        altitude: position.coords.altitude ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      };
    } catch (err) {
      return null;
    }
  },
};
