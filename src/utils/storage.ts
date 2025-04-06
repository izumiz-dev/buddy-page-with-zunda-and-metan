import { Settings, DEFAULT_SETTINGS } from '../types';

/**
 * Saves settings to Chrome storage
 * @param settings Settings object to save
 */
export const saveSettings = async (settings: Settings): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Loads settings from Chrome storage
 * @returns Settings object or default settings if not found
 */
export const loadSettings = async (): Promise<Settings> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get('settings', (result) => {
      if (chrome.runtime.lastError || !result.settings) {
        resolve({ ...DEFAULT_SETTINGS });
      } else {
        resolve(result.settings as Settings);
      }
    });
  });
};

/**
 * Resets settings to default values
 */
export const resetSettings = async (): Promise<void> => {
  return saveSettings({ ...DEFAULT_SETTINGS });
};