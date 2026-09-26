/**
 * RapidRescue Driver App - API Service Layer Abstraction
 * Configured to interface with Ravin's FastAPI backend in future phases.
 */

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
}

export const getApiConfig = (): ApiConfig => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
  return {
    baseUrl,
    timeoutMs: 15000,
  };
};

/**
 * Service placeholder ready for Axios client integration in Phase 2
 */
export const apiClient = {
  getConfig: getApiConfig,
};
