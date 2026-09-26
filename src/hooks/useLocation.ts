/**
 * RapidRescue useLocation Hook (Phase 3)
 *
 * Provides GPS permission state, single-shot location capture,
 * reverse geocoding result, and loading/error states.
 *
 * Screens must NOT call Location APIs directly.
 * All location interactions flow through this hook.
 */

import { useState, useCallback } from 'react';
import {
  CapturedLocation,
  LocationPermissionStatus,
  ReverseGeocodedAddress,
  LocationError,
  LocationOutcome,
} from '@/types/location.types';
import { locationService, getLocationErrorMessage } from '@/services/location.service';

export interface UseLocationReturn {
  /** Current OS permission status */
  permissionStatus: LocationPermissionStatus;
  /** Whether a location fetch is in progress */
  isFetching: boolean;
  /** The successfully captured GPS location */
  location: CapturedLocation | null;
  /** Reverse-geocoded address (may be null even on success — supplementary only) */
  address: ReverseGeocodedAddress | null;
  /** Current error code, if any */
  error: LocationError | null;
  /** Human-readable error message */
  errorMessage: string | null;
  /** Request permission, then capture GPS location */
  requestAndCapture: () => Promise<LocationOutcome>;
  /** Re-capture location after it was already obtained */
  recapture: () => Promise<LocationOutcome>;
  /** Clear location state */
  reset: () => void;
}

export function useLocation(): UseLocationReturn {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('undetermined');
  const [isFetching, setIsFetching] = useState(false);
  const [location, setLocation] = useState<CapturedLocation | null>(null);
  const [address, setAddress] = useState<ReverseGeocodedAddress | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performCapture = useCallback(async (): Promise<LocationOutcome> => {
    setIsFetching(true);
    setError(null);
    setErrorMessage(null);

    const outcome = await locationService.captureCurrentLocation();

    if (outcome.success) {
      setLocation(outcome.location);
      setAddress(outcome.address);
      setPermissionStatus('granted');
    } else {
      setError(outcome.error);
      setErrorMessage(outcome.message);
      if (outcome.error === 'PERMISSION_DENIED') {
        setPermissionStatus('denied');
      }
    }

    setIsFetching(false);
    return outcome;
  }, []);

  const requestAndCapture = useCallback(async (): Promise<LocationOutcome> => {
    // Request permission first if not yet granted
    const currentStatus = await locationService.checkPermission();
    if (currentStatus !== 'granted') {
      const newStatus = await locationService.requestPermission();
      setPermissionStatus(newStatus);
      if (newStatus !== 'granted') {
        const failure: LocationOutcome = {
          success: false,
          error: 'PERMISSION_DENIED',
          message: getLocationErrorMessage('PERMISSION_DENIED'),
        };
        setError('PERMISSION_DENIED');
        setErrorMessage(failure.message);
        setIsFetching(false);
        return failure;
      }
    } else {
      setPermissionStatus('granted');
    }

    return performCapture();
  }, [performCapture]);

  const recapture = useCallback(async (): Promise<LocationOutcome> => {
    setLocation(null);
    setAddress(null);
    return performCapture();
  }, [performCapture]);

  const reset = useCallback(() => {
    setLocation(null);
    setAddress(null);
    setError(null);
    setErrorMessage(null);
  }, []);

  return {
    permissionStatus,
    isFetching,
    location,
    address,
    error,
    errorMessage,
    requestAndCapture,
    recapture,
    reset,
  };
}

export default useLocation;
