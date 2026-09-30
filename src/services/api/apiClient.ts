/**
 * RapidRescue Driver Mobile App - Generic HTTP API Client
 * Clean, typed HTTP abstraction for FastAPI REST communication.
 * Supports GET, POST, PUT, PATCH, DELETE with automatic token injection,
 * JSON serialization, AbortController timeouts, and ApiError handling.
 */

import { HttpMethod, ApiRequestConfig, HttpApiResponse } from '../../types/api';
import { ApiError } from './apiError';
import { API_CONFIG } from '../../config/apiConfig';
import { tokenStorage } from '../auth/tokenStorage';

export type UnauthorizedHandler = () => Promise<void> | void;

let globalUnauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  globalUnauthorizedHandler = handler;
};

export class ApiClient {
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(baseUrl: string = API_CONFIG.baseUrl, timeoutMs: number = API_CONFIG.timeoutMs) {
    this.baseUrl = baseUrl;
    this.defaultTimeoutMs = timeoutMs;
  }

  /**
   * Updates base URL dynamically (e.g. if configured during runtime)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Helper to format path and append query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = this.baseUrl ? `${this.baseUrl}${cleanEndpoint}` : cleanEndpoint;

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });

    if (queryParts.length === 0) {
      return fullUrl;
    }

    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}${queryParts.join('&')}`;
  }

  /**
   * Core request execution handler
   */
  async request<TResponse, TBody = unknown>(
    method: HttpMethod,
    endpoint: string,
    config: ApiRequestConfig<TBody> = {}
  ): Promise<HttpApiResponse<TResponse>> {
    const url = this.buildUrl(endpoint, config.params);
    const timeoutMs = config.timeoutMs || this.defaultTimeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const isFormData =
      typeof FormData !== 'undefined' &&
      (config.body instanceof FormData ||
        (config.body !== null &&
          typeof config.body === 'object' &&
          typeof (config.body as any).append === 'function'));

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config.headers,
    };

    if (isFormData) {
      delete headers['Content-Type'];
    } else if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Automatically inject bearer auth token if required (default true unless explicitly set false)
    if (config.requiresAuth !== false) {
      const token = await tokenStorage.getToken();
      if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (config.body !== undefined && method !== 'GET') {
      if (isFormData) {
        fetchOptions.body = config.body as any;
      } else {
        fetchOptions.body =
          typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
      }
    }

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      // Parse JSON response safely
      let responseData: unknown = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Automatic session clearance and redirection on HTTP 401 Unauthorized
        // Only trigger for authenticated endpoints where an actual Authorization header was sent
        if (
          response.status === 401 &&
          config.requiresAuth !== false &&
          Boolean(headers.Authorization)
        ) {
          const authVal = String(headers.Authorization || '');
          const isMockAdmin = authVal.includes('admin_session_');

          if (!isMockAdmin) {
            try {
              await tokenStorage.clearToken();
              if (globalUnauthorizedHandler) {
                await globalUnauthorizedHandler();
              }
            } catch {
              // Ignore error in unauthorized handler
            }
          }
        }

        throw ApiError.fromResponse(response.status, responseData, url, method);
      }

      return {
        data: responseData as TResponse,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      // Check for timeout / abort
      if (err instanceof Error && err.name === 'AbortError') {
        throw ApiError.timeoutError(timeoutMs, url, method);
      }

      // Network / connectivity failure
      throw ApiError.networkError(
        err instanceof Error ? err.message : undefined,
        url,
        method
      );
    }
  }

  /**
   * HTTP GET
   */
  async get<TResponse>(
    endpoint: string,
    config?: Omit<ApiRequestConfig<never>, 'body'>
  ): Promise<HttpApiResponse<TResponse>> {
    return this.request<TResponse>('GET', endpoint, config);
  }

  /**
   * HTTP POST
   */
  async post<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'body'>
  ): Promise<HttpApiResponse<TResponse>> {
    return this.request<TResponse, TBody>('POST', endpoint, { ...config, body });
  }

  /**
   * HTTP PUT
   */
  async put<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'body'>
  ): Promise<HttpApiResponse<TResponse>> {
    return this.request<TResponse, TBody>('PUT', endpoint, { ...config, body });
  }

  /**
   * HTTP PATCH
   */
  async patch<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'body'>
  ): Promise<HttpApiResponse<TResponse>> {
    return this.request<TResponse, TBody>('PATCH', endpoint, { ...config, body });
  }

  /**
   * HTTP DELETE
   */
  async delete<TResponse>(
    endpoint: string,
    config?: Omit<ApiRequestConfig<never>, 'body'>
  ): Promise<HttpApiResponse<TResponse>> {
    return this.request<TResponse>('DELETE', endpoint, config);
  }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();
