/**
 * RapidRescue Driver Mobile App - API Error Model & Handlers
 * Reusable typed error representation for HTTP status codes, validation failures,
 * timeouts, and network outages without leaking internal server stack traces to users.
 */

import { ApiErrorCode, ApiErrorDetails, HttpMethod } from '../../types/api';

export class ApiError extends Error implements ApiErrorDetails {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly timestamp: number;
  readonly url?: string;
  readonly method?: HttpMethod;

  constructor(params: ApiErrorDetails) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.timestamp = params.timestamp || Date.now();
    this.url = params.url;
    this.method = params.method;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Constructs an ApiError from an HTTP response payload and status code
   */
  static fromResponse(
    status: number,
    responseBody: unknown,
    url?: string,
    method?: HttpMethod
  ): ApiError {
    let code: ApiErrorCode = 'SERVER_ERROR';
    let message = 'An unexpected server error occurred. Please try again.';

    switch (status) {
      case 400:
        code = 'BAD_REQUEST';
        message = 'Invalid request. Please verify the emergency data.';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        message = 'Your session has expired. Please log in again.';
        break;
      case 403:
        code = 'FORBIDDEN';
        message = 'You are not authorized to perform this operation.';
        break;
      case 404:
        code = 'NOT_FOUND';
        message = 'The requested emergency or dispatch record was not found.';
        break;
      case 409:
        code = 'CONFLICT';
        message = 'This emergency has already been updated or assigned to another ambulance.';
        break;
      case 422:
        code = 'VALIDATION_ERROR';
        message = 'The submitted emergency response format was invalid.';
        break;
      case 429:
        code = 'RATE_LIMITED';
        message = 'Too many requests sent. Standing by briefly before retrying.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        code = 'SERVER_ERROR';
        message = 'Dispatch server is temporarily unreachable. Please retry shortly.';
        break;
      default:
        if (status >= 400 && status < 500) {
          code = 'BAD_REQUEST';
          message = 'Dispatch request could not be processed.';
        }
        break;
    }

    // Extract detail or message if provided in structured FastAPI JSON format
    let extractedDetails: unknown = responseBody;
    if (responseBody && typeof responseBody === 'object') {
      const bodyRecord = responseBody as Record<string, unknown>;
      if (typeof bodyRecord.detail === 'string' && bodyRecord.detail.trim().length > 0) {
        message = bodyRecord.detail;
      } else if (typeof bodyRecord.message === 'string' && bodyRecord.message.trim().length > 0) {
        message = bodyRecord.message;
      } else if (bodyRecord.detail && typeof bodyRecord.detail === 'object') {
        extractedDetails = bodyRecord.detail;
      }
    }

    return new ApiError({
      status,
      code,
      message,
      details: extractedDetails,
      timestamp: Date.now(),
      url,
      method,
    });
  }

  /**
   * Constructs an ApiError for device offline or connection dropped
   */
  static networkError(message?: string, url?: string, method?: HttpMethod): ApiError {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to dispatch. Please check your network connection.',
      timestamp: Date.now(),
      url,
      method,
    });
  }

  /**
   * Constructs an ApiError for request timeouts
   */
  static timeoutError(timeoutMs: number, url?: string, method?: HttpMethod): ApiError {
    return new ApiError({
      status: 408,
      code: 'TIMEOUT_ERROR',
      message: 'Dispatch server response timed out. Please check your connection and retry.',
      timestamp: Date.now(),
      url,
      method,
    });
  }
}

/**
 * Type guard for ApiError instances
 */
export const isApiError = (err: unknown): err is ApiError => {
  return err instanceof ApiError;
};

/**
 * Formats a user-friendly error message from any thrown error
 */
export const formatFriendlyErrorMessage = (err: unknown): string => {
  if (isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
