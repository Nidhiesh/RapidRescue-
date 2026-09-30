/**
 * RapidRescue Driver Mobile App - Location Synchronization Service
 * 15-second periodic GPS telemetry updates conforming to the finalized backend contract:
 * POST /api/v1/drivers/me/location
 *
 * Operates continuously while driver is ONLINE (both AVAILABLE and BUSY).
 * Stops immediately when driver transitions to OFFLINE.
 */

import { DriverLocation, DriverLocationUpdatePayload } from '../../types';
import { driverService } from '../driver/driverService';

export interface ILocationUpdateService {
  updateDriverLocation(driverId: string, location: DriverLocation): Promise<void>;
  startPeriodicSync(driverId: string, getLocation: () => DriverLocation | null): void;
  stopPeriodicSync(): void;
  getLastSyncedPayload(): DriverLocationUpdatePayload | null;
}

const GPS_UPDATE_INTERVAL_MS = 15000; // 15-second contract interval

let lastSyncedPayload: DriverLocationUpdatePayload | null = null;
let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let lastSyncTimestamp: number = 0;

export const locationUpdateService: ILocationUpdateService = {
  /**
   * Transmits driver coordinates to central dispatch.
   * Throttles to maintain 15-second cadence while updating the cached position.
   */
  async updateDriverLocation(driverId: string, location: DriverLocation): Promise<void> {
    const payload: DriverLocationUpdatePayload = {
      driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      heading: location.heading,
      speed: location.speed,
      timestamp: location.timestamp || Date.now(),
    };

    lastSyncedPayload = payload;

    const now = Date.now();
    // Transmit if initial fix or interval elapsed
    if (now - lastSyncTimestamp >= GPS_UPDATE_INTERVAL_MS) {
      lastSyncTimestamp = now;
      await driverService.updateLocation(payload);
    }
  },

  /**
   * Starts the 15-second interval timer to guarantee continuous telemetry
   * even when stationary while ONLINE (AVAILABLE or BUSY).
   */
  startPeriodicSync(driverId: string, getLocation: () => DriverLocation | null): void {
    this.stopPeriodicSync();

    // Initial immediate sync if location is available
    const initialLoc = getLocation();
    if (initialLoc) {
      this.updateDriverLocation(driverId, initialLoc);
    }

    syncIntervalId = setInterval(async () => {
      const currentLoc = getLocation() || (lastSyncedPayload ? {
        latitude: lastSyncedPayload.latitude,
        longitude: lastSyncedPayload.longitude,
        accuracy: lastSyncedPayload.accuracy,
        altitude: lastSyncedPayload.altitude,
        heading: lastSyncedPayload.heading,
        speed: lastSyncedPayload.speed,
        timestamp: Date.now(),
      } : null);

      if (currentLoc) {
        const payload: DriverLocationUpdatePayload = {
          driverId,
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
          accuracy: currentLoc.accuracy,
          altitude: currentLoc.altitude,
          heading: currentLoc.heading,
          speed: currentLoc.speed,
          timestamp: Date.now(),
        };

        lastSyncedPayload = payload;
        lastSyncTimestamp = Date.now();
        await driverService.updateLocation(payload);
      }
    }, GPS_UPDATE_INTERVAL_MS);
  },

  /**
   * Stops 15-second GPS updates when driver goes OFFLINE
   */
  stopPeriodicSync(): void {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
    lastSyncTimestamp = 0;
  },

  /**
   * Retrieves the latest formatted telemetry payload
   */
  getLastSyncedPayload(): DriverLocationUpdatePayload | null {
    return lastSyncedPayload;
  },
};
