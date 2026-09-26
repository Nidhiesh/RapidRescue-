/**
 * RapidRescue API Configuration
 *
 * Configurable parameters for backend communication.
 * Endpoints are modularized so changes from backend developers
 * can be accommodated in one single place.
 */

import { Config } from './env';

export const API_CONFIG = {
  baseUrl: Config.apiBaseUrl,
  wsUrl: Config.wsBaseUrl,
  timeoutMs: Config.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  retryAttempts: 2,
  retryDelayMs: 1000,
} as const;

export default API_CONFIG;
