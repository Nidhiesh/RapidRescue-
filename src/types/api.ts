/**
 * RapidRescue Driver Mobile App - API & Network Type Definitions
 * Typed contracts for generic HTTP communication, request options, response wrappers,
 * and structured error models for FastAPI integration.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiErrorCode =
  | 'BAD_REQUEST'         // 400
  | 'UNAUTHORIZED'        // 401
  | 'FORBIDDEN'           // 403
  | 'NOT_FOUND'           // 404
  | 'CONFLICT'            // 409
  | 'VALIDATION_ERROR'    // 422
  | 'RATE_LIMITED'        // 429
  | 'SERVER_ERROR'        // 500+
  | 'NETWORK_ERROR'       // Device disconnected / unreachable
  | 'TIMEOUT_ERROR'       // Request timed out
  | 'ABORTED'             // Cancelled by client
  | 'UNKNOWN_ERROR';      // Unhandled / unexpected exception

export interface ApiRequestConfig<TBody = unknown> {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  body?: TBody;
  requiresAuth?: boolean;
}

export interface HttpApiResponse<TData> {
  data: TData;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiErrorDetails {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  timestamp: number;
  url?: string;
  method?: HttpMethod;
}
