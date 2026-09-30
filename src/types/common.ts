/**
 * RapidRescue Driver App - Core TypeScript Foundation Types
 */

/**
 * Standard asynchronous operation state helper
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Standard API Response envelope abstraction for future backend endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Status indicator token types
 */
export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'critical' | 'info';
