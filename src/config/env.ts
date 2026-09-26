/**
 * RapidRescue Environment Configuration
 *
 * Provides strongly typed access to environment variables.
 * Fallbacks are provided for development safety, but can be overridden
 * via .env or EXPO_PUBLIC_* variables.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  env: AppEnvironment;
  isDevelopment: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  apiTimeoutMs: number;
  enableMocks: boolean;
}

const rawEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as AppEnvironment;

export const Config: EnvironmentConfig = {
  env: rawEnv,
  isDevelopment: rawEnv === 'development',
  isProduction: rawEnv === 'production',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8000/api/v1',
  wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://10.0.2.2:8000/ws',
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 15000,
  enableMocks: process.env.EXPO_PUBLIC_ENABLE_MOCKS === 'true',
};

export default Config;
