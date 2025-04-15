import { Settings, DEFAULT_SETTINGS } from '../types';
import { apiKeyManager } from './apiKeyManager';

// Settings key in storage
const SETTINGS_KEY = 'zunda_metan_settings';

/**
 * Saves settings to Chrome storage with encryption
 * @param settings Settings object to save
 */
export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    // Gemini API key is stored separately with encryption
    if (settings.geminiApiKey) {
      await apiKeyManager.saveApiKey('geminiApiKey', settings.geminiApiKey);
      
      // Create a new object excluding the API key, instead of using delete
      const { geminiApiKey, ...otherSettings } = settings; 
      
      // Store other settings
      await apiKeyManager.saveSetting(SETTINGS_KEY, JSON.stringify(otherSettings));
    } else {
      // If API key is not provided or empty, save all other settings
      const { geminiApiKey, ...otherSettings } = settings; // Ensure API key is excluded if empty
      await apiKeyManager.saveSetting(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

/**
 * Loads settings from Chrome storage with decryption
 * @returns Settings object or default settings if not found
 */
export const loadSettings = async (): Promise<Settings> => {
  try {
    // Get stored settings
    const settingsStr = await apiKeyManager.getSetting(SETTINGS_KEY);
    const settings = settingsStr ? JSON.parse(settingsStr) : { ...DEFAULT_SETTINGS };
    
    // Load API key separately
    const apiKey = await apiKeyManager.getApiKey('geminiApiKey');
    if (apiKey) {
      settings.geminiApiKey = apiKey;
    }
    
    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Resets settings to default values
 */
export const resetSettings = async (): Promise<void> => {
  try {
    // Clear API key
    await apiKeyManager.saveApiKey('geminiApiKey', '');
    
    // Reset settings
    return saveSettings({ ...DEFAULT_SETTINGS });
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
};
