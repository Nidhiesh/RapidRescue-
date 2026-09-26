/**
 * RapidRescue Secure Storage Service Interface
 *
 * Provides contract and fallback implementation for persisting tokens
 * and sensitive patient state securely.
 */

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

/**
 * Memory fallback storage for non-native environments or pre-initialization
 */
class MemoryStorageService implements IStorageService {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memoryStore.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryStore.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async clearAll(): Promise<void> {
    this.memoryStore.clear();
  }
}

export const storageService: IStorageService = new MemoryStorageService();
export default storageService;
