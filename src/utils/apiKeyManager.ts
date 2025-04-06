/**
 * Utility class for secure API key management
 * Enhances security with encrypted storage and in-memory caching
 */

import { encryptText, decryptText } from './crypto';

// Define key types
export enum ApiKeyType {
  GEMINI = 'geminiApiKey',
  VOICEVOX = 'voicevoxUrl'  // 必要に応じて追加
}

// Key expiration time (milliseconds) - default is 30 minutes
const KEY_EXPIRY_TIME = 30 * 60 * 1000;

// In-memory cache (valid only during session)
interface KeyCache {
  value: string;
  timestamp: number;
}

class ApiKeyManager {
  private keyCache: Map<ApiKeyType | string, KeyCache> = new Map();
  
  /**
   * Securely saves an API key
   * @param type Type of the key
   * @param key API key string
   * @returns Whether the save operation was successful
   */
  async saveApiKey(type: ApiKeyType | string, key: string): Promise<boolean> {
    try {
      // Remove if key is empty
      if (!key || key.trim() === '') {
        await chrome.storage.sync.remove(String(type));
        this.keyCache.delete(type);
        return true;
      }
      
      // Encrypt the key
      const encryptedKey = await encryptText(key);
      
      // Save the encrypted key
      await chrome.storage.sync.set({ [type]: encryptedKey });
      
      // Update in-memory cache
      this.keyCache.set(type, {
        value: key,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to save API key (${type}):`, error);
      return false;
    }
  }
  
  /**
   * Securely retrieves an API key
   * @param type Type of the key
   * @returns API key string, or empty string if retrieval fails
   */
  async getApiKey(type: ApiKeyType | string): Promise<string> {
    try {
      // Check in-memory cache
      const cachedKey = this.keyCache.get(type);
      if (cachedKey && (Date.now() - cachedKey.timestamp) < KEY_EXPIRY_TIME) {
        return cachedKey.value;
      }
      
      // Get from storage if not in cache
      const result = await chrome.storage.sync.get(String(type));
      const encryptedKey = result[String(type)];
      
      // If key does not exist
      if (!encryptedKey) {
        return '';
      }
      
      // Decrypt the key
      const key = await decryptText(encryptedKey);
      
      // Update in-memory cache if decryption is successful
      if (key) {
        this.keyCache.set(type, {
          value: key,
          timestamp: Date.now()
        });
      }
      
      return key;
    } catch (error) {
      console.error(`Failed to retrieve API key (${type}):`, error);
      return '';
    }
  }
  
  /**
   * Checks if an API key exists
   * @param type Type of the key
   * @returns Whether the key exists
   */
  async hasApiKey(type: ApiKeyType | string): Promise<boolean> {
    try {
      const key = await this.getApiKey(type);
      return !!key;
    } catch (error) {
      console.error(`Failed to check API key (${type}):`, error);
      return false;
    }
  }
  
  /**
   * Clears the in-memory cache
   * Should be called for security reasons or when the extension restarts
   */
  clearCache(): void {
    this.keyCache.clear();
  }
  
  /**
   * Save arbitrary settings with encryption
   * @param key Setting key
   * @param value Setting value
   * @returns Whether the save operation was successful
   */
  async saveSetting(key: string, value: string): Promise<boolean> {
    return this.saveApiKey(key, value);
  }
  
  /**
   * Get encrypted setting value
   * @param key Setting key
   * @returns Setting value
   */
  async getSetting(key: string): Promise<string> {
    return this.getApiKey(key);
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
