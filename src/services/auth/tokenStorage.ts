/**
 * RapidRescue Driver Mobile App - Authentication Token Storage
 * Secure persistent storage for JWT session tokens using Expo SecureStore.
 * Strictly avoids storing plaintext credentials and never logs or exposes tokens.
 */

import * as SecureStore from 'expo-secure-store';

export interface ITokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  hasToken(): Promise<boolean>;
}

const SECURE_TOKEN_KEY = 'rapidrescue_driver_jwt_token';

class SecureTokenStorage implements ITokenStorage {
  private inMemoryCache: string | null = null;
  private isLoaded: boolean = false;

  async getToken(): Promise<string | null> {
    if (this.inMemoryCache !== null) {
      return this.inMemoryCache;
    }

    try {
      const stored = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      this.inMemoryCache = stored ? stored.trim() : null;
      this.isLoaded = true;
      return this.inMemoryCache;
    } catch {
      return this.inMemoryCache;
    }
  }

  async setToken(token: string): Promise<void> {
    const cleanToken = token.trim();
    this.inMemoryCache = cleanToken;
    this.isLoaded = true;

    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, cleanToken);
    } catch {
      // In-memory fallback if SecureStore fails on unsupported environment
    }
  }

  async clearToken(): Promise<void> {
    this.inMemoryCache = null;
    this.isLoaded = true;

    try {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    } catch {
      // Cleanup safety
    }
  }

  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token.length > 0;
  }
}

export const tokenStorage: ITokenStorage = new SecureTokenStorage();
