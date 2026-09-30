import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  DriverDutyStatus,
  DriverAvailability,
  LocationTrackingStatus,
  DriverLocation,
  LocationServiceError,
} from '../types/index';
import {
  locationService,
  mockLocationService,
  locationUpdateService,
  driverService,
} from '../services';
import { isMockEnabled } from '../config/apiConfig';
import { useAuth } from './AuthContext';

interface LocationContextValue {
  dutyStatus: DriverDutyStatus;
  availability: DriverAvailability;
  trackingStatus: LocationTrackingStatus;
  currentLocation: DriverLocation | null;
  locationError: string | null;
  isConnecting: boolean;
  isSimulatorMode: boolean;
  toggleSimulatorMode: () => void;
  setAvailability: (status: DriverAvailability, driverId?: string) => Promise<void> | void;
  goOnline: (isVerified: boolean, driverId?: string) => Promise<{ success: boolean; error?: string }>;
  goOffline: (driverId?: string) => Promise<void>;
  retryLocation: (isVerified: boolean, driverId?: string) => Promise<void>;
  clearError: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status: authStatus } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<DriverDutyStatus>('OFFLINE');
  const [availability, setAvailabilityState] = useState<DriverAvailability>('UNAVAILABLE');
  const [trackingStatus, setTrackingStatus] = useState<LocationTrackingStatus>('INACTIVE');
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSimulatorMode, setIsSimulatorMode] = useState<boolean>(false);

  // Store watcher cleanup reference
  const stopWatcherRef = useRef<(() => void) | null>(null);
  const currentLocationRef = useRef<DriverLocation | null>(null);

  // Stop any active location subscription safely
  const stopActiveWatcher = useCallback(() => {
    locationUpdateService.stopPeriodicSync();
    if (stopWatcherRef.current) {
      try {
        stopWatcherRef.current();
      } catch {
        // cleanup safety
      }
      stopWatcherRef.current = null;
    }
  }, []);

  // Synchronize initial duty status and availability from authenticated session or backend
  useEffect(() => {
    if (authStatus === 'AUTHENTICATED' && session?.role === 'DRIVER') {
      const driverSession = session;
      if (driverSession.dutyStatus) {
        setDutyStatus(driverSession.dutyStatus);
      }
      if (driverSession.availability) {
        setAvailabilityState(driverSession.availability);
      }
      if (!isMockEnabled() && (!driverSession.dutyStatus || !driverSession.availability)) {
        driverService
          .getProfile()
          .then((profile) => {
            if (profile.dutyStatus) {
              setDutyStatus(profile.dutyStatus);
            }
            if (profile.availability) {
              setAvailabilityState(profile.availability);
            }
          })
          .catch(() => {
            // Keep default/current state safely if backend is temporarily unreachable
          });
      }
    } else if (authStatus === 'UNAUTHENTICATED') {
      stopActiveWatcher();
      setDutyStatus('OFFLINE');
      setAvailabilityState('UNAVAILABLE');
      setCurrentLocation(null);
      setLocationError(null);
    }
  }, [authStatus, session, stopActiveWatcher]);

  // Keep ref synchronized with state
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  // Ensure clean teardown on unmount
  useEffect(() => {
    return () => {
      stopActiveWatcher();
    };
  }, [stopActiveWatcher]);

  const activeService = isSimulatorMode ? mockLocationService : locationService;

  /**
   * Transition driver to ONLINE duty status.
   *
   * Flow:
   * 1. Authorization check (driver must be VERIFIED).
   * 2. Request real GPS permission and obtain initial GPS fix.
   * 3. Send ONLINE request to backend: PATCH /api/v1/drivers/me/duty-status
   * 4. ONLY AFTER successful backend confirmation, start continuous GPS tracking,
   *    15-second telemetry synchronization, and WebSocket connection.
   * 5. If backend rejects, local UI does NOT claim ONLINE.
   */
  const goOnline = async (
    isVerified: boolean,
    driverId: string = 'RR-DRV-1001'
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Critical Authorization Check
    if (!isVerified) {
      const errorMsg = 'Operational features locked. Admin verification is required before you can go online.';
      setLocationError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsConnecting(true);
    setLocationError(null);
    setTrackingStatus('REQUESTING_PERMISSION');

    try {
      // 2. Request real GPS permission & obtain initial fix
      const initialLocation = await activeService.getCurrentLocation();
      currentLocationRef.current = initialLocation;
      setCurrentLocation(initialLocation);

      // Stop previous watcher if any
      stopActiveWatcher();

      // 3. Send ONLINE request to backend BEFORE starting continuous tracking or WebSocket
      const dutyResult = await driverService.updateDutyStatus(driverId, 'ONLINE', {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        accuracy: initialLocation.accuracy,
      });

      if (!dutyResult.success) {
        throw new Error(dutyResult.error || 'Dispatch backend rejected online duty request.');
      }

      // 4. Start continuous location watcher ONLY AFTER successful backend response
      const cleanup = await activeService.startLocationTracking(
        (newLoc) => {
          currentLocationRef.current = newLoc;
          setCurrentLocation(newLoc);
          locationUpdateService.updateDriverLocation(driverId, newLoc);
        },
        (locErr: LocationServiceError) => {
          if (locErr.code === 'PERMISSION_DENIED') {
            setTrackingStatus('PERMISSION_DENIED');
          } else if (locErr.code === 'SERVICES_DISABLED') {
            setTrackingStatus('SERVICES_DISABLED');
          } else {
            setTrackingStatus('ERROR');
          }
          setLocationError(locErr.message);
        }
      );

      stopWatcherRef.current = cleanup;

      // 5. Start 15-second telemetry synchronization
      locationUpdateService.startPeriodicSync(driverId, () => currentLocationRef.current);

      // 6. Mark driver ONLINE and update availability based on backend response
      setDutyStatus('ONLINE');
      setTrackingStatus('ACTIVE');
      setAvailabilityState(dutyResult.availability || 'AVAILABLE');
      setIsConnecting(false);

      return { success: true };
    } catch (err: unknown) {
      // Teardown tracking on failure — local UI stays OFFLINE
      stopActiveWatcher();
      setDutyStatus('OFFLINE');
      setAvailabilityState('UNAVAILABLE');
      setIsConnecting(false);

      const locError = err as LocationServiceError;
      if (locError && locError.code === 'SERVICES_DISABLED') {
        setTrackingStatus('SERVICES_DISABLED');
        setLocationError(locError.message || 'Location services are disabled on device.');
      } else if (locError && locError.code === 'PERMISSION_DENIED') {
        setTrackingStatus('PERMISSION_DENIED');
        setLocationError(locError.message || 'Location permission was denied.');
      } else {
        setTrackingStatus('ERROR');
        setLocationError(
          err instanceof Error
            ? err.message
            : 'Unable to transition to online duty. Please try again.'
        );
      }

      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unable to transition to online duty.',
      };
    }
  };

  /**
   * Transition driver to OFFLINE duty status.
   *
   * Flow:
   * 1. Send OFFLINE request to backend: PATCH /api/v1/drivers/me/duty-status
   * 2. Stop GPS tracking updates and 15-second telemetry sync.
   * 3. Update local state to OFFLINE & UNAVAILABLE (which triggers WebSocket closure in EmergencyContext).
   */
  const goOffline = async (driverId: string = 'RR-DRV-1001'): Promise<void> => {
    // 1. Send OFFLINE request to backend
    try {
      await driverService.updateDutyStatus(driverId, 'OFFLINE');
    } catch {
      // Safe catch: shutdown local tracking regardless to preserve device battery and privacy
    }

    // 2. Stop continuous GPS tracking & periodic sync
    stopActiveWatcher();
    locationUpdateService.stopPeriodicSync();

    // 3. Mark OFFLINE & UNAVAILABLE
    setDutyStatus('OFFLINE');
    setTrackingStatus('INACTIVE');
    setAvailabilityState('UNAVAILABLE');
    setCurrentLocation(null);
    currentLocationRef.current = null;
    setLocationError(null);
    setIsConnecting(false);
  };

  /**
   * Synchronize driver dispatch availability (AVAILABLE / BUSY / UNAVAILABLE)
   * with backend: PATCH /api/v1/drivers/me/availability
   */
  const setAvailability = useCallback(
    async (newAvailability: DriverAvailability, driverId: string = 'RR-DRV-1001') => {
      if (!isMockEnabled()) {
        try {
          const res = await driverService.updateAvailability(driverId, newAvailability);
          if (res.success && res.availability) {
            setAvailabilityState(res.availability);
            return;
          }
        } catch {
          // If backend rejected or failed, do not allow UI to contradict backend
          return;
        }
      }
      setAvailabilityState(newAvailability);
    },
    []
  );

  const retryLocation = async (isVerified: boolean, driverId?: string) => {
    await goOnline(isVerified, driverId);
  };

  const toggleSimulatorMode = () => {
    const nextMode = !isSimulatorMode;
    setIsSimulatorMode(nextMode);
    if (dutyStatus === 'ONLINE') {
      goOffline();
    }
  };

  const clearError = () => setLocationError(null);

  return (
    <LocationContext.Provider
      value={{
        dutyStatus,
        availability,
        trackingStatus,
        currentLocation,
        locationError,
        isConnecting,
        isSimulatorMode,
        toggleSimulatorMode,
        setAvailability,
        goOnline,
        goOffline,
        retryLocation,
        clearError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextValue => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
