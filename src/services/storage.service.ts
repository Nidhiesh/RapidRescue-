/**
 * RapidRescue Secure Storage Service
 *
 * Persists sensitive authentication tokens and session credentials
 * using native hardware-backed keystore/keychain via expo-secure-store.
 * Falls back to in-memory store on platforms where SecureStore is unavailable.
 */

import * as SecureStore from 'expo-secure-store';

export interface IStorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rapidrescue_auth_token',
  REFRESH_TOKEN: 'rapidrescue_refresh_token',
  PATIENT_PROFILE: 'rapidrescue_patient_profile',
  ACTIVE_EMERGENCY_ID: 'rapidrescue_active_emergency_id',
} as const;

class SecureStorageService implements IStorageService {
  private memoryFallback = new Map<string, string>();
  private isSecureAvailable: boolean | null = null;

  private async checkAvailability(): Promise<boolean> {
    if (this.isSecureAvailable !== null) {
      return this.isSecureAvailable;
    }
    // Check if running in Node.js test environment or Web
    const isNodeOrWeb =
      typeof process !== 'undefined' && process.versions?.node != null && typeof window === 'undefined';
    if (isNodeOrWeb) {
      this.isSecureAvailable = false;
      return false;
    }

    try {
      this.isSecureAvailable = await SecureStore.isAvailableAsync();
    } catch {
      this.isSecureAvailable = false;
    }
    return this.isSecureAvailable;
  }

  async getItem(key: string): Promise<string | null> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      return this.memoryFallback.get(key) ?? null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[SecureStore] Error reading key "${key}":`, error);
      return this.memoryFallback.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      this.memoryFallback.set(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.warn(`[SecureStore] Error writing key "${key}":`, error);
      this.memoryFallback.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    const isAvailable = await this.checkAvailability();
    this.memoryFallback.delete(key);
    if (!isAvailable) {
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`[SecureStore] Error removing key "${key}":`, error);
    }
  }

  async clearAll(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await this.removeItem(STORAGE_KEYS.PATIENT_PROFILE);
    await this.removeItem(STORAGE_KEYS.ACTIVE_EMERGENCY_ID);
    this.memoryFallback.clear();
  }
}

export const storageService: IStorageService = new SecureStorageService();
export default storageService;
