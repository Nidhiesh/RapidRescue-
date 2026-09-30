/**
 * RapidRescue Driver Mobile App - Emergency Service Interface
 * Service implementation for dispatch response (ACCEPT, REJECT, TIMEOUT)
 * and incident completion using the finalized RapidRescue backend contract.
 *
 * Endpoints:
 * POST /api/v1/dispatch/respond
 * POST /api/v1/dispatch/complete
 */

import {
  EmergencyRequest,
  EmergencyPriority,
  EmergencyResponsePayload,
  EmergencyResponseResult,
  DispatchRespondPayload,
  DispatchCompletePayload,
} from '../../types';
import { isMockEnabled } from '../../config/apiConfig';
import { apiClient } from '../api/apiClient';
import { mockEmergencyService } from './mockEmergencyService';

export interface IEmergencyService {
  createSimulatedRequest(priority?: EmergencyPriority): EmergencyRequest;
  respondToRequest(payload: EmergencyResponsePayload): Promise<EmergencyResponseResult>;
  completeEmergency(requestId: string, driverId?: string): Promise<EmergencyResponseResult>;
  getActiveEmergency(driverId?: string): Promise<EmergencyRequest | null>;
}

class EmergencyService implements IEmergencyService {
  createSimulatedRequest(priority?: EmergencyPriority): EmergencyRequest {
    return mockEmergencyService.createSimulatedRequest(priority);
  }

  /**
   * Responds to an incoming emergency call (ACCEPT, REJECT, TIMEOUT)
   * Uses POST /api/v1/dispatch/respond
   */
  async respondToRequest(payload: EmergencyResponsePayload): Promise<EmergencyResponseResult> {
    if (
      isMockEnabled() ||
      payload.requestId?.startsWith('EMG-') ||
      payload.requestId?.startsWith('sim-')
    ) {
      return mockEmergencyService.respondToRequest(payload);
    }

    try {
      await apiClient.post<unknown, DispatchRespondPayload>(
        '/api/v1/dispatch/respond',
        {
          requestId: payload.requestId,
          action: payload.action,
        }
      );

      return {
        success: true,
        requestId: payload.requestId,
        action: payload.action,
        timestamp: Date.now(),
      };
    } catch (err: unknown) {
      const isConflict =
        (err as any)?.status === 409 ||
        (err as any)?.code === 'CONFLICT' ||
        (err instanceof Error && (
          err.message.includes('409') ||
          err.message.toLowerCase().includes('already assigned') ||
          err.message.toLowerCase().includes('conflict')
        ));

      const errorMessage =
        isConflict
          ? 'This emergency has already been assigned to another driver.'
          : err instanceof Error
          ? err.message
          : 'Failed to transmit dispatch response.';

      return {
        success: false,
        isConflict,
        requestId: payload.requestId,
        action: payload.action,
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * Completes an active emergency incident
   * Uses POST /api/v1/dispatch/complete
   */
  async completeEmergency(
    requestId: string,
    driverId?: string
  ): Promise<EmergencyResponseResult> {
    if (
      isMockEnabled() ||
      requestId?.startsWith('EMG-') ||
      requestId?.startsWith('sim-')
    ) {
      return mockEmergencyService.completeEmergency(requestId, driverId || '');
    }

    try {
      await apiClient.post<unknown, DispatchCompletePayload>(
        '/api/v1/dispatch/complete',
        {
          requestId,
        }
      );

      return {
        success: true,
        requestId,
        action: 'ACCEPT',
        timestamp: Date.now(),
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to complete emergency incident.';
      return {
        success: false,
        requestId,
        action: 'ACCEPT',
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * Retrieves active assigned incident
   */
  async getActiveEmergency(driverId?: string): Promise<EmergencyRequest | null> {
    if (isMockEnabled()) {
      return mockEmergencyService.getActiveEmergency(driverId);
    }
    return null;
  }
}

export const emergencyService: IEmergencyService = new EmergencyService();
