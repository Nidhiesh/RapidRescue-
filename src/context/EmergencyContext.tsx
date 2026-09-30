import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  EmergencyRequest,
  EmergencyRequestStatus,
  EmergencyPriority,
  EmergencyPickupLocation,
  EMERGENCY_TIMEOUT_DURATIONS,
} from '../types';
import { emergencyService, realtimeService } from '../services';
import { useAuth } from './AuthContext';
import { useVerification } from './VerificationContext';
import { useLocation } from './LocationContext';

interface EmergencyContextValue {
  currentRequest: EmergencyRequest | null;
  patientLocation: EmergencyPickupLocation | null;
  requestStatus: EmergencyRequestStatus;
  isAlertVisible: boolean;
  countdownSeconds: number;
  totalDurationSeconds: number;
  lastActionMessage: string | null;
  isCompleting: boolean;
  completionError: string | null;
  isAccepting: boolean;
  isRejecting: boolean;
  acceptRequest: () => Promise<boolean>;
  rejectRequest: () => Promise<void>;
  timeoutRequest: () => Promise<void>;
  dismissAlert: () => void;
  openAlert: () => void;
  completeEmergency: () => Promise<boolean>;
  clearCompletionError: () => void;
  simulateIncomingEmergency: (priority?: EmergencyPriority) => { success: boolean; reason?: string };
}

const EmergencyContext = createContext<EmergencyContextValue | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const { status: verificationStatus } = useVerification();
  const { dutyStatus, availability, setAvailability } = useLocation();

  const [currentRequest, setCurrentRequest] = useState<EmergencyRequest | null>(null);
  const [patientLocation, setPatientLocation] = useState<EmergencyPickupLocation | null>(null);
  const [requestStatus, setRequestStatus] = useState<EmergencyRequestStatus>('NONE');
  const [isAlertVisible, setIsAlertVisible] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(20);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Synchronous refs to prevent race conditions and duplicate action transmissions
  const isActionPendingRef = useRef<boolean>(false);
  const currentRequestRef = useRef<EmergencyRequest | null>(null);
  const requestStatusRef = useRef<EmergencyRequestStatus>('NONE');
  const dutyStatusRef = useRef(dutyStatus);
  const availabilityRef = useRef(availability);
  const verificationStatusRef = useRef(verificationStatus);

  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);

  useEffect(() => {
    requestStatusRef.current = requestStatus;
  }, [requestStatus]);

  useEffect(() => {
    dutyStatusRef.current = dutyStatus;
  }, [dutyStatus]);

  useEffect(() => {
    availabilityRef.current = availability;
  }, [availability]);

  useEffect(() => {
    verificationStatusRef.current = verificationStatus;
  }, [verificationStatus]);

  // Timer reference for response countdown
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear countdown timer safely
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  /**
   * Timeout Flow:
   * When countdown reaches zero or server expires request:
   * 1. Prevent duplicate responses.
   * 2. Send TIMEOUT to POST /api/v1/dispatch/respond.
   * 3. Driver remains AVAILABLE.
   * 4. Clear active emergency.
   */
  const timeoutRequest = useCallback(async () => {
    if (isActionPendingRef.current) return;
    if (!currentRequestRef.current || requestStatusRef.current !== 'INCOMING') return;

    isActionPendingRef.current = true;
    clearTimer();

    const activeReq = currentRequestRef.current;
    const reqId = activeReq.emergencyId || activeReq.id;

    setIsAlertVisible(false);
    setCurrentRequest(null);
    setPatientLocation(null);
    setRequestStatus('NONE');

    if (dutyStatusRef.current === 'ONLINE') {
      setAvailability('AVAILABLE');
    }
    setLastActionMessage(`Emergency offer #${reqId} timed out. Returned to available pool.`);

    try {
      await emergencyService.respondToRequest({
        requestId: reqId,
        driverId: session && session.role === 'DRIVER' ? session.driverId : 'RR-DRV-1001',
        action: 'TIMEOUT',
        timestamp: Date.now(),
      });
    } catch {
      // Safe error catch
    } finally {
      isActionPendingRef.current = false;
    }
  }, [clearTimer, session, setAvailability]);

  /**
   * Start countdown synchronized with backend server deadline
   * Note: Backend automatically controls and enforces dispatch timeouts (20s/40s/60s).
   * The frontend countdown visually indicates remaining time without sending a conflicting timeout.
   */
  const startCountdown = useCallback(
    (initialSeconds: number, totalSeconds: number, responseDeadline?: string) => {
      clearTimer();
      setTotalDurationSeconds(totalSeconds > 0 ? totalSeconds : 20);
      setCountdownSeconds(initialSeconds > 0 ? initialSeconds : 0);

      timerRef.current = setInterval(() => {
        let remaining = -1;
        if (responseDeadline) {
          const deadlineMs = new Date(responseDeadline).getTime();
          if (!isNaN(deadlineMs)) {
            remaining = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
          }
        }

        setCountdownSeconds((prev) => {
          const nextVal = remaining >= 0 ? remaining : prev - 1;
          if (nextVal <= 0) {
            clearTimer();
            // Automatically close alert on expiry to prevent accepting after timeout.
            // Backend DISPATCH_TIMEOUT event will authoritatively finalize state.
            setIsAlertVisible(false);
            return 0;
          }
          return nextVal;
        });
      }, 1000);
    },
    [clearTimer]
  );

  /**
   * WebSocket Connection Lifecycle:
   * Connects to ws/wss dispatch endpoint with driver JWT
   * while driver is VERIFIED + ONLINE.
   * Disconnects when driver goes OFFLINE.
   */
  useEffect(() => {
    if (verificationStatus === 'VERIFIED' && dutyStatus === 'ONLINE') {
      realtimeService.connect(session?.token);
    } else {
      realtimeService.disconnect();
    }

    return () => {
      realtimeService.disconnect();
    };
  }, [verificationStatus, dutyStatus, session?.token]);

  /**
   * Realtime Server Event Listeners:
   * 1. EMERGENCY_DISPATCH
   * 2. DISPATCH_TIMEOUT
   * 3. DISPATCH_RESPONSE_ACK
   * 4. REQUEST_UPDATE
   * 5. PATIENT_LOCATION
   * 6. ETA_UPDATE
   * 7. EMERGENCY_COMPLETED
   * 8. EMERGENCY_CANCELLED
   *
   * Utilizes synchronous refs so listeners are registered once and never duplicated.
   */
  useEffect(() => {
    // 1. EMERGENCY_DISPATCH
    const unsubscribeDispatch = realtimeService.onEmergencyRequest((incomingRequest) => {
      // Gate 1: Driver must be VERIFIED
      if (verificationStatusRef.current !== 'VERIFIED') return;
      // Gate 2: Driver must be ONLINE
      if (dutyStatusRef.current !== 'ONLINE') return;
      // Gate 3: Driver must be AVAILABLE
      if (availabilityRef.current !== 'AVAILABLE') return;
      // Gate 4: Cannot overwrite active or incoming emergency
      if (requestStatusRef.current === 'ACCEPTED' || requestStatusRef.current === 'INCOMING') {
        return;
      }

      // Calculate server deadline & countdown
      let remainingSec = 20;
      let totalSec = 20;

      if (incomingRequest.responseDeadline) {
        const deadlineMs = new Date(incomingRequest.responseDeadline).getTime();
        if (!isNaN(deadlineMs)) {
          remainingSec = Math.max(0, Math.round((deadlineMs - Date.now()) / 1000));
        }
      }

      if (incomingRequest.timeoutSeconds !== undefined && incomingRequest.timeoutSeconds > 0) {
        totalSec = incomingRequest.timeoutSeconds;
        if (!incomingRequest.responseDeadline) {
          remainingSec = incomingRequest.timeoutSeconds;
        }
      } else if (EMERGENCY_TIMEOUT_DURATIONS[incomingRequest.priority]) {
        totalSec = EMERGENCY_TIMEOUT_DURATIONS[incomingRequest.priority];
        if (!incomingRequest.responseDeadline) {
          remainingSec = totalSec;
        }
      }

      // Late arrival safety check
      if (remainingSec <= 0) {
        return;
      }

      const pickupLoc: EmergencyPickupLocation = incomingRequest.pickupLocation || {
        latitude: incomingRequest.pickupLatitude,
        longitude: incomingRequest.pickupLongitude,
      };

      setPatientLocation(pickupLoc);
      setCurrentRequest(incomingRequest);
      setRequestStatus('INCOMING');
      setIsAlertVisible(true);
      setLastActionMessage(null);
      setCompletionError(null);
      startCountdown(remainingSec, totalSec, incomingRequest.responseDeadline);
    });

    // 2. DISPATCH_TIMEOUT
    const unsubscribeTimeout = realtimeService.onDispatchTimeout((data) => {
      const activeReq = currentRequestRef.current;
      const targetId = data.requestId;
      if (
        activeReq &&
        (!targetId || activeReq.id === targetId || activeReq.emergencyId === targetId)
      ) {
        clearTimer();
        setIsAlertVisible(false);
        if (requestStatusRef.current === 'INCOMING') {
          setCurrentRequest(null);
          setPatientLocation(null);
          setRequestStatus('NONE');
          if (dutyStatusRef.current === 'ONLINE') {
            setAvailability('AVAILABLE');
          }
          setLastActionMessage('Dispatch offer timed out by backend server.');
        }
      }
    });

    // 3. DISPATCH_RESPONSE_ACK
    const unsubscribeAck = realtimeService.onDispatchResponseAck((data) => {
      const activeReq = currentRequestRef.current;
      const targetId = data.requestId;
      if (
        activeReq &&
        (!targetId || activeReq.id === targetId || activeReq.emergencyId === targetId)
      ) {
        if (data.status === 'ACCEPTED' || data.action === 'ACCEPTED') {
          setRequestStatus('ACCEPTED');
          setAvailability('BUSY');
          setIsAlertVisible(false);
          setCompletionError(null);
          setLastActionMessage('Dispatch confirmed ambulance assignment.');
        }
      }
    });

    // 4. REQUEST_UPDATE with status COMPLETED
    const unsubscribeUpdate = realtimeService.onRequestUpdate((data) => {
      const activeReq = currentRequestRef.current;
      const targetId = data.requestId;
      if (
        activeReq &&
        (!targetId || activeReq.id === targetId || activeReq.emergencyId === targetId)
      ) {
        if (data.status === 'COMPLETED') {
          clearTimer();
          setCurrentRequest(null);
          setPatientLocation(null);
          setRequestStatus('NONE');
          setIsAlertVisible(false);
          setCompletionError(null);
          setIsCompleting(false);
          if (dutyStatusRef.current === 'ONLINE') {
            setAvailability('AVAILABLE');
          }
          setLastActionMessage('Incident marked as completed by dispatch.');
        }
      }
    });

    // 5. PATIENT_LOCATION: Updates pickup location on live driver map
    const unsubscribePatientLocation = realtimeService.onPatientLocation((data) => {
      const activeReq = currentRequestRef.current;
      if (
        activeReq &&
        (activeReq.id === data.emergencyId || activeReq.emergencyId === data.emergencyId)
      ) {
        const updatedLoc: EmergencyPickupLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        setPatientLocation(updatedLoc);
        setCurrentRequest((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pickupLatitude: data.latitude,
            pickupLongitude: data.longitude,
            pickupLocation: updatedLoc,
          };
        });
      }
    });

    // 6. ETA_UPDATE: Dynamic recalculation of sector distance and ETA
    const unsubscribeEta = realtimeService.onEtaUpdate((data) => {
      const activeReq = currentRequestRef.current;
      if (
        activeReq &&
        (activeReq.id === data.emergencyId || activeReq.emergencyId === data.emergencyId)
      ) {
        setCurrentRequest((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            distanceKm: data.distanceKm !== undefined ? data.distanceKm : prev.distanceKm,
            etaMinutes: data.etaMinutes !== undefined ? data.etaMinutes : prev.etaMinutes,
            estimatedDistance:
              data.distanceKm !== undefined ? `${data.distanceKm} km` : prev.estimatedDistance,
            estimatedResponseTime:
              data.etaMinutes !== undefined ? `${data.etaMinutes} min` : prev.estimatedResponseTime,
          };
        });
      }
    });

    // 7. EMERGENCY_COMPLETED
    const unsubscribeCompleted = realtimeService.onEmergencyCompleted((data) => {
      const activeReq = currentRequestRef.current;
      const targetId = data.emergencyId || data.requestId;
      if (
        activeReq &&
        (!targetId || activeReq.id === targetId || activeReq.emergencyId === targetId)
      ) {
        clearTimer();
        setCurrentRequest(null);
        setPatientLocation(null);
        setRequestStatus('NONE');
        setIsAlertVisible(false);
        setCompletionError(null);
        setIsCompleting(false);
        if (dutyStatusRef.current === 'ONLINE') {
          setAvailability('AVAILABLE');
        }
        setLastActionMessage('Emergency completed.');
      }
    });

    // 8. EMERGENCY_CANCELLED
    const unsubscribeCancelled = realtimeService.onEmergencyCancelled((data) => {
      const activeReq = currentRequestRef.current;
      const targetId = data.emergencyId || data.requestId;
      if (
        activeReq &&
        (!targetId || activeReq.id === targetId || activeReq.emergencyId === targetId)
      ) {
        clearTimer();
        setCurrentRequest(null);
        setPatientLocation(null);
        setRequestStatus('NONE');
        setIsAlertVisible(false);
        setCompletionError(null);
        setIsCompleting(false);
        if (dutyStatusRef.current === 'ONLINE') {
          setAvailability('AVAILABLE');
        }
        setLastActionMessage(
          data.reason ? `Emergency cancelled: ${data.reason}` : 'Emergency cancelled by dispatch.'
        );
      }
    });

    return () => {
      unsubscribeDispatch();
      unsubscribeTimeout();
      unsubscribeAck();
      unsubscribeUpdate();
      unsubscribePatientLocation();
      unsubscribeEta();
      unsubscribeCompleted();
      unsubscribeCancelled();
    };
  }, [startCountdown, clearTimer, setAvailability]);

  /**
   * Accept Flow:
   * 1. Stop countdown.
   * 2. Prevent duplicate responses or accepting expired offers.
   * 3. Send ACCEPT to POST /api/v1/dispatch/respond.
   * 4. Handle HTTP 409 (atomic double-accept protection) gracefully:
   *    close offer, show message: "This emergency has already been assigned to another driver."
   *    driver returns to AVAILABLE, no auto-retry.
   * 5. On success: emergency becomes ACCEPTED, driver becomes BUSY.
   */
  const acceptRequest = async (): Promise<boolean> => {
    if (isActionPendingRef.current || isAccepting || isRejecting) return false;
    if (!currentRequestRef.current || requestStatusRef.current !== 'INCOMING') return false;

    if (countdownSeconds <= 0) {
      setIsAlertVisible(false);
      setLastActionMessage('Dispatch offer expired. Cannot accept.');
      return false;
    }

    isActionPendingRef.current = true;
    setIsAccepting(true);
    clearTimer();

    const activeReq = currentRequestRef.current;
    const reqId = activeReq.emergencyId || activeReq.id;

    try {
      const result = await emergencyService.respondToRequest({
        requestId: reqId,
        driverId: session && session.role === 'DRIVER' ? session.driverId : 'RR-DRV-1001',
        action: 'ACCEPT',
        timestamp: Date.now(),
      });

      if (result.success) {
        const acceptedReq: EmergencyRequest = {
          ...activeReq,
          status: 'ACCEPTED',
          respondedAt: Date.now(),
        };

        setCurrentRequest(acceptedReq);
        setRequestStatus('ACCEPTED');
        setIsAlertVisible(false);
        setAvailability('BUSY');
        setCompletionError(null);
        setLastActionMessage('EMERGENCY ACCEPTED — STATUS: BUSY');
        return true;
      } else {
        // Handle 409 conflict or expired response safely
        setIsAlertVisible(false);
        setRequestStatus('NONE');
        setCurrentRequest(null);
        setPatientLocation(null);
        if (dutyStatusRef.current === 'ONLINE') {
          setAvailability('AVAILABLE');
        }
        setLastActionMessage(
          result.isConflict
            ? 'This emergency has already been assigned to another driver.'
            : result.error || 'Unable to accept emergency: offer expired or reallocated.'
        );
        return false;
      }
    } catch {
      setIsAlertVisible(false);
      setRequestStatus('NONE');
      setCurrentRequest(null);
      setPatientLocation(null);
      if (dutyStatusRef.current === 'ONLINE') {
        setAvailability('AVAILABLE');
      }
      setLastActionMessage('Network communication failed during acceptance.');
      return false;
    } finally {
      setIsAccepting(false);
      isActionPendingRef.current = false;
    }
  };

  /**
   * Reject Flow:
   * 1. Stop countdown.
   * 2. Prevent duplicate response.
   * 3. Send REJECT to POST /api/v1/dispatch/respond.
   * 4. Keep driver AVAILABLE.
   * 5. Clear active emergency.
   */
  const rejectRequest = async () => {
    if (isActionPendingRef.current || isAccepting || isRejecting) return;
    if (!currentRequestRef.current || requestStatusRef.current !== 'INCOMING') return;

    isActionPendingRef.current = true;
    setIsRejecting(true);
    clearTimer();

    const activeReq = currentRequestRef.current;
    const reqId = activeReq.emergencyId || activeReq.id;
    setIsAlertVisible(false);

    try {
      await emergencyService.respondToRequest({
        requestId: reqId,
        driverId: session && session.role === 'DRIVER' ? session.driverId : 'RR-DRV-1001',
        action: 'REJECT',
        timestamp: Date.now(),
      });
    } catch {
      // Safe catch
    } finally {
      setCurrentRequest(null);
      setPatientLocation(null);
      setRequestStatus('NONE');
      setIsRejecting(false);
      if (dutyStatusRef.current === 'ONLINE') {
        setAvailability('AVAILABLE');
      }
      setLastActionMessage(`Emergency #${reqId} declined. Returned to available pool.`);
      isActionPendingRef.current = false;
    }
  };

  /**
   * Complete Flow (Phase 10 Hardened):
   * 1. Prevent duplicate completion.
   * 2. Verify that the current emergency is ACCEPTED.
   * 3. Call POST /api/v1/dispatch/complete with { requestId }.
   * 4. Wait for backend response.
   * 5. On success:
   *    - clear active emergency and patient location
   *    - set emergency status to NONE
   *    - driver becomes AVAILABLE
   *    - dashboard returns to normal available state
   * 6. On failure:
   *    - do NOT falsely mark completed
   *    - keep active mission visible
   *    - show useful error message and allow retry
   */
  const completeEmergency = async (): Promise<boolean> => {
    // 1. Prevent duplicate completion
    if (isActionPendingRef.current || isCompleting) {
      return false;
    }

    // 2. Verify that the current emergency is ACCEPTED
    if (!currentRequestRef.current || requestStatusRef.current !== 'ACCEPTED') {
      return false;
    }

    isActionPendingRef.current = true;
    setIsCompleting(true);
    setCompletionError(null);
    clearTimer();

    const activeReq = currentRequestRef.current;
    const reqId = activeReq.emergencyId || activeReq.id;
    const drvId = session && session.role === 'DRIVER' ? session.driverId : 'RR-DRV-1001';

    try {
      // 3. Call POST /api/v1/dispatch/complete
      const result = await emergencyService.completeEmergency(reqId, drvId);

      if (result.success) {
        // 5. On success:
        setCurrentRequest(null);
        setPatientLocation(null);
        setRequestStatus('NONE');
        setIsAlertVisible(false);
        setCompletionError(null);

        if (dutyStatusRef.current === 'ONLINE') {
          setAvailability('AVAILABLE');
        }
        setLastActionMessage('Emergency completed.');
        return true;
      } else {
        // 6. On failure: keep mission visible, set error message
        const errMsg = result.error || 'Failed to complete emergency on dispatch server. Please retry.';
        setCompletionError(errMsg);
        setLastActionMessage(errMsg);
        return false;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error completing emergency. Please retry.';
      setCompletionError(errMsg);
      setLastActionMessage(errMsg);
      return false;
    } finally {
      setIsCompleting(false);
      isActionPendingRef.current = false;
    }
  };

  const clearCompletionError = () => {
    setCompletionError(null);
  };

  const dismissAlert = () => {
    setIsAlertVisible(false);
  };

  const openAlert = () => {
    if (requestStatus === 'INCOMING' && currentRequest) {
      setIsAlertVisible(true);
    }
  };

  /**
   * Development simulation trigger (retains mock capability)
   */
  const simulateIncomingEmergency = (
    priority: EmergencyPriority = 'CRITICAL'
  ): { success: boolean; reason?: string } => {
    if (verificationStatus !== 'VERIFIED') {
      return {
        success: false,
        reason: 'Driver must be VERIFIED before receiving emergency alerts.',
      };
    }

    if (dutyStatus !== 'ONLINE') {
      return {
        success: false,
        reason: 'Driver must be ONLINE on the network to receive emergency dispatches.',
      };
    }

    if (availability !== 'AVAILABLE') {
      return {
        success: false,
        reason: `Driver is currently ${availability}. Must be AVAILABLE to accept new dispatches.`,
      };
    }

    if (requestStatus === 'ACCEPTED' || requestStatus === 'INCOMING') {
      return {
        success: false,
        reason: 'Cannot simulate emergency while an incident is already active.',
      };
    }

    const mockReq = emergencyService.createSimulatedRequest(priority);
    const duration = EMERGENCY_TIMEOUT_DURATIONS[priority] || 20;

    const pickupLoc: EmergencyPickupLocation = mockReq.pickupLocation || {
      latitude: mockReq.pickupLatitude,
      longitude: mockReq.pickupLongitude,
    };

    setPatientLocation(pickupLoc);
    setCurrentRequest(mockReq);
    setRequestStatus('INCOMING');
    setIsAlertVisible(true);
    setLastActionMessage(null);
    setCompletionError(null);
    startCountdown(duration, duration, mockReq.responseDeadline);

    return { success: true };
  };

  // If driver goes OFFLINE while in INCOMING state, cancel alert safely
  useEffect(() => {
    if (dutyStatus === 'OFFLINE' && requestStatus === 'INCOMING') {
      clearTimer();
      setIsAlertVisible(false);
      setRequestStatus('NONE');
      setCurrentRequest(null);
      setPatientLocation(null);
    }
  }, [dutyStatus, requestStatus, clearTimer]);

  return (
    <EmergencyContext.Provider
      value={{
        currentRequest,
        patientLocation,
        requestStatus,
        isAlertVisible,
        countdownSeconds,
        totalDurationSeconds,
        lastActionMessage,
        isCompleting,
        completionError,
        isAccepting,
        isRejecting,
        acceptRequest,
        rejectRequest,
        timeoutRequest,
        dismissAlert,
        openAlert,
        completeEmergency,
        clearCompletionError,
        simulateIncomingEmergency,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = (): EmergencyContextValue => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
