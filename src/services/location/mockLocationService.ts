/**
 * RapidRescue Driver Mobile App - Mock Location Service
 * Development Location Simulator providing fictional GPS fixes for testing.
 */

import { DriverLocation, LocationServiceError } from '../../types';
import { ILocationService } from './locationService';

// Fixed fictional dispatch station coordinate (Coimbatore, Tamil Nadu)
const DEFAULT_SIMULATED_LOCATION: DriverLocation = {
  latitude: 11.0168,
  longitude: 76.9558,
  accuracy: 6,
  altitude: 410,
  heading: 90,
  speed: 0,
  timestamp: Date.now(),
};

export const mockLocationService: ILocationService = {
  async requestLocationPermission(): Promise<boolean> {
    return true;
  },

  async getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return 'granted';
  },

  async isLocationServicesEnabled(): Promise<boolean> {
    return true;
  },

  async getCurrentLocation(): Promise<DriverLocation> {
    return {
      ...DEFAULT_SIMULATED_LOCATION,
      timestamp: Date.now(),
    };
  },

  async startLocationTracking(
    onLocation: (location: DriverLocation) => void,
    _onError: (err: LocationServiceError) => void
  ): Promise<() => void> {
    // Immediate initial fix
    onLocation({
      ...DEFAULT_SIMULATED_LOCATION,
      timestamp: Date.now(),
    });

    let currentLat = DEFAULT_SIMULATED_LOCATION.latitude;
    let currentLng = DEFAULT_SIMULATED_LOCATION.longitude;

    // Simulate minor movement every 4 seconds
    const interval = setInterval(() => {
      currentLat += (Math.random() - 0.5) * 0.0002;
      currentLng += (Math.random() - 0.5) * 0.0002;

      onLocation({
        latitude: parseFloat(currentLat.toFixed(5)),
        longitude: parseFloat(currentLng.toFixed(5)),
        accuracy: Math.floor(5 + Math.random() * 5),
        altitude: 410,
        heading: Math.floor(Math.random() * 360),
        speed: parseFloat((Math.random() * 15).toFixed(1)),
        timestamp: Date.now(),
      });
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  },

  async getLastKnownLocation(): Promise<DriverLocation | null> {
    return {
      ...DEFAULT_SIMULATED_LOCATION,
      timestamp: Date.now(),
    };
  },
};
