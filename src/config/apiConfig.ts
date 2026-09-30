/**
 * RapidRescue Driver Mobile App - API & Backend Configuration
 * Centralized environment configuration abstraction for FastAPI integration.
 * Ensures business logic never hardcodes URLs or localhost paths.
 */

export interface ApiEnvironmentConfig {
  baseUrl: string;
  wsUrl: string;
  timeoutMs: number;
  isMockMode: boolean;
  appEnv: 'development' | 'staging' | 'production';
}

/**
 * Resolved application API environment configuration.
 * By default, connects to the hosted FastAPI backend on Railway.
 */
export const API_CONFIG: ApiEnvironmentConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://web-production-2c3bd.up.railway.app',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL?.trim() || 'wss://web-production-2c3bd.up.railway.app',
  timeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 15000,
  isMockMode: process.env.EXPO_PUBLIC_USE_MOCK_SERVICES === 'true',
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') || 'development',
};

/**
 * Helper to check whether mock services should be used
 */
export const isMockEnabled = (): boolean => {
  return API_CONFIG.isMockMode;
};

/**
 * Safe accessor for base URL with validation check
 */
export const getBaseUrl = (): string => {
  return API_CONFIG.baseUrl;
};

/**
 * Resolves the WebSocket URL incorporating the authenticated session token.
 * Output format: wss://web-production-2c3bd.up.railway.app/ws/driver?token=<JWT>
 */
export const getWebSocketUrl = (token?: string | null): string => {
  let wsUrl = API_CONFIG.wsUrl;
  if (!wsUrl && API_CONFIG.baseUrl) {
    wsUrl = `${API_CONFIG.baseUrl.replace(/^http/, 'ws')}/ws/driver`;
  }
  // Ensure the WebSocket path ends with /ws/driver
  if (wsUrl && !wsUrl.includes('/ws/driver')) {
    wsUrl = `${wsUrl.replace(/\/+$/, '')}/ws/driver`;
  }
  if (!token) {
    return wsUrl;
  }
  const separator = wsUrl.includes('?') ? '&' : '?';
  return `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Resolves media or photo URLs from the backend.
 * If backend returns URLs with localhost/127.0.0.1/10.0.2.2 or relative paths,
 * this function maps them to the configured baseUrl for physical device access.
 */
export const resolveBackendMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const base = API_CONFIG.baseUrl.replace(/\/+$/, '');

  // If already a relative path starting with '/'
  if (trimmed.startsWith('/')) {
    return base ? `${base}${trimmed}` : trimmed;
  }

  // If URL contains localhost or 127.0.0.1 or 10.0.2.2 with port 8000
  // e.g. http://localhost:8000/api/v1/emergencies/...
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '10.0.2.2') {
      if (base) {
        const baseParsed = new URL(base);
        parsed.protocol = baseParsed.protocol;
        parsed.hostname = baseParsed.hostname;
        parsed.port = baseParsed.port;
        return parsed.toString();
      }
    }
  } catch {
    if (base && (trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1') || trimmed.startsWith('http://10.0.2.2'))) {
      return trimmed.replace(/^https?:\/\/[^/]+/, base);
    }
  }

  // If URL contains legacy cloud deployment host, migrate to Railway
  if (base && /\.onrender\.com/i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/[^/]+/i, base);
  }

  return trimmed;
};
