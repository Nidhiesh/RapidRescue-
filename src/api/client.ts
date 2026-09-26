/**
 * RapidRescue REST API Client
 *
 * Decoupled, type-safe HTTP client with configurable base URL, timeout,
 * authentication token injection, and structured error normalization.
 */

import { API_CONFIG } from '@/config/api.config';
import { ApiResponse, ApiError, HttpMethod, RequestOptions } from '@/types/api.types';

type TokenProvider = () => Promise<string | null>;

class ApiClient {
  private baseUrl: string;
  private tokenProvider: TokenProvider | null = null;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set base URL dynamically (e.g. switching environments or local testing)
   */
  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Get current active base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Register a token provider hook to automatically supply Bearer tokens
   */
  public setTokenProvider(provider: TokenProvider) {
    this.tokenProvider = provider;
  }

  /**
   * Core request dispatcher with timeout and error handling
   */
  public async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const timeoutMs = options?.timeout ?? API_CONFIG.timeoutMs;

    const headers: Record<string, string> = {
      ...API_CONFIG.headers,
      ...(options?.headers ?? {}),
    };

    // Inject Bearer token if required and available
    if (options?.requiresAuth !== false && this.tokenProvider) {
      try {
        const token = await this.tokenProvider();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('[ApiClient] Failed to acquire auth token:', err);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const responseData = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const apiError: ApiError = {
          statusCode: response.status,
          message:
            (typeof responseData === 'object' && responseData && 'message' in responseData
              ? String(responseData.message)
              : response.statusText) || 'Request failed',
          details: typeof responseData === 'object' ? responseData : undefined,
        };
        throw apiError;
      }

      return {
        success: true,
        data: (isJson && responseData && 'data' in responseData ? responseData.data : responseData) as T,
        message: isJson && responseData && 'message' in responseData ? responseData.message : undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if ((error as { name?: string }).name === 'AbortError') {
        const timeoutError: ApiError = {
          statusCode: 408,
          message: `Request timed out after ${timeoutMs}ms. Please check your backend connection.`,
          errorCode: 'TIMEOUT',
        };
        throw timeoutError;
      }

      if ((error as ApiError).statusCode) {
        throw error as ApiError;
      }

      const networkError: ApiError = {
        statusCode: 0,
        message: (error as Error).message || 'Network request failed. Is the FastAPI server running?',
        errorCode: 'NETWORK_ERROR',
      };
      throw networkError;
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
