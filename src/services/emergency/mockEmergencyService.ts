/**
 * RapidRescue Driver Mobile App - Mock Emergency Service
 * Development & Prototype service simulating dispatch engine alert generation,
 * patient distress records, action states (ACCEPT, REJECT, TIMEOUT, COMPLETE).
 */

import {
  EmergencyRequest,
  EmergencyPriority,
  EmergencyResponsePayload,
  EmergencyResponseResult,
} from '../../types';

// Pre-configured mock emergency scenarios for development testing
const MOCK_SCENARIOS = [
  {
    patientName: 'Kavitha S.',
    patientPhone: '+91 98401 23456',
    pickupAddress: 'Crosscut Road, Gandhipuram, Coimbatore',
    pickupLatitude: 11.0185,
    pickupLongitude: 76.962,
    emergencyType: 'Acute Cardiac Distress / Chest Pain',
    priority: 'CRITICAL' as EmergencyPriority,
    estimatedDistance: '2.4 km',
    estimatedResponseTime: '6 min',
  },
  {
    patientName: 'Rajesh Kumar',
    patientPhone: '+91 94432 98765',
    pickupAddress: 'Avinashi Road, Peelamedu, Coimbatore',
    pickupLatitude: 11.0289,
    pickupLongitude: 76.9984,
    emergencyType: 'Severe Road Traffic Accident (Trauma)',
    priority: 'CRITICAL' as EmergencyPriority,
    estimatedDistance: '3.8 km',
    estimatedResponseTime: '8 min',
  },
  {
    patientName: 'Meenakshi Sundaram',
    patientPhone: '+91 97890 54321',
    pickupAddress: 'DB Road, RS Puram, Coimbatore',
    pickupLatitude: 11.0094,
    pickupLongitude: 76.9512,
    emergencyType: 'Respiratory Distress (Asthma/Dyspnea)',
    priority: 'HIGH' as EmergencyPriority,
    estimatedDistance: '1.9 km',
    estimatedResponseTime: '5 min',
  },
  {
    patientName: 'Anand V.',
    patientPhone: '+91 99520 11223',
    pickupAddress: 'Mettupalayam Road, Saibaba Colony, Coimbatore',
    pickupLatitude: 11.0345,
    pickupLongitude: 76.9458,
    emergencyType: 'Uncontrolled Bleeding / Laceration',
    priority: 'HIGH' as EmergencyPriority,
    estimatedDistance: '4.2 km',
    estimatedResponseTime: '10 min',
  },
  {
    patientName: 'Lakshmi Narayanan',
    patientPhone: '+91 98422 66778',
    pickupAddress: 'Trichy Road, Ramanathapuram, Coimbatore',
    pickupLatitude: 10.9985,
    pickupLongitude: 76.9821,
    emergencyType: 'High Grade Pediatric Fever / Seizure',
    priority: 'NORMAL' as EmergencyPriority,
    estimatedDistance: '5.1 km',
    estimatedResponseTime: '12 min',
  },
];

let scenarioCounter = 0;
let currentActiveEmergency: EmergencyRequest | null = null;

export const mockEmergencyService = {
  /**
   * Generates a simulated incoming emergency dispatch request
   * for development and demonstration verification.
   */
  createSimulatedRequest(priorityOverride?: EmergencyPriority): EmergencyRequest {
    const template = MOCK_SCENARIOS[scenarioCounter % MOCK_SCENARIOS.length];
    scenarioCounter += 1;

    const chosenPriority = priorityOverride || template.priority;
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const reqId = `EMG-${randomId}`;
    const timeoutSec = chosenPriority === 'CRITICAL' ? 20 : chosenPriority === 'HIGH' ? 40 : 60;
    const deadline = new Date(Date.now() + timeoutSec * 1000).toISOString();
    const distanceKmVal = parseFloat(template.estimatedDistance.replace(/[^0-9.]/g, '')) || 2.4;

    const request: EmergencyRequest = {
      id: reqId,
      emergencyId: reqId,
      patientName: template.patientName,
      patientPhone: template.patientPhone,
      pickupLatitude: template.pickupLatitude,
      pickupLongitude: template.pickupLongitude,
      pickupAddress: template.pickupAddress,
      emergencyType: template.emergencyType,
      priority: chosenPriority,
      createdAt: new Date().toISOString(),
      responseDeadline: deadline,
      timeoutSeconds: timeoutSec,
      distanceKm: distanceKmVal,
      estimatedDistance: template.estimatedDistance,
      estimatedResponseTime: template.estimatedResponseTime,
      status: 'INCOMING',
    };

    currentActiveEmergency = request;
    return request;
  },

  /**
   * Simulates driver response transmission (ACCEPT / REJECT / TIMEOUT)
   */
  async respondToRequest(payload: EmergencyResponsePayload): Promise<EmergencyResponseResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (currentActiveEmergency && currentActiveEmergency.id === payload.requestId) {
      if (payload.action === 'ACCEPT') {
        currentActiveEmergency.status = 'ACCEPTED';
        currentActiveEmergency.respondedAt = payload.timestamp;
      } else if (payload.action === 'REJECT') {
        currentActiveEmergency.status = 'REJECTED';
        currentActiveEmergency.respondedAt = payload.timestamp;
        currentActiveEmergency = null;
      } else if (payload.action === 'TIMEOUT') {
        currentActiveEmergency.status = 'EXPIRED';
        currentActiveEmergency.respondedAt = payload.timestamp;
        currentActiveEmergency = null;
      }
    }

    return {
      success: true,
      requestId: payload.requestId,
      action: payload.action,
      timestamp: Date.now(),
    };
  },

  /**
   * Completes an active incident
   */
  async completeEmergency(
    requestId: string,
    _driverId: string
  ): Promise<EmergencyResponseResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    currentActiveEmergency = null;

    return {
      success: true,
      requestId,
      action: 'ACCEPT',
      timestamp: Date.now(),
    };
  },

  /**
   * Retrieves currently active assigned emergency
   */
  async getActiveEmergency(_driverId?: string): Promise<EmergencyRequest | null> {
    return currentActiveEmergency;
  },
};
