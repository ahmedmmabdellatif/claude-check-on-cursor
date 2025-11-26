// dataReset.ts
// Centralized data reset utilities for coach-safe recovery

import AsyncStorage from '@react-native-async-storage/async-storage';

// All AsyncStorage keys used by this app
const APP_STORAGE_KEYS = {
  // Document storage
  DOCUMENT_PREFIX: 'parsed_doc_',
  // Journey storage
  JOURNEY_PREFIX: 'journey:',
  // Progress storage
  PROGRESS_PREFIX: 'journeyProgress:',
  // Any other app-specific keys can be added here
};

/**
 * Get all keys that belong to this app
 */
async function getAllAppKeys(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(key => {
      return (
        key.startsWith(APP_STORAGE_KEYS.DOCUMENT_PREFIX) ||
        key.startsWith(APP_STORAGE_KEYS.JOURNEY_PREFIX) ||
        key.startsWith(APP_STORAGE_KEYS.PROGRESS_PREFIX)
      );
    });
  } catch (error) {
    console.error('[dataReset] Error getting app keys:', error);
    return [];
  }
}

/**
 * Reset all local app data
 * This clears all AsyncStorage keys used by this app
 */
export async function resetAllLocalData(): Promise<void> {
  try {
    const keysToRemove = await getAllAppKeys();
    
    if (keysToRemove.length === 0) {
      console.log('[dataReset] No app data to clear');
      return;
    }

    await AsyncStorage.multiRemove(keysToRemove);
    console.log(`[dataReset] Cleared ${keysToRemove.length} keys`);
  } catch (error) {
    console.error('[dataReset] Error resetting all data:', error);
    throw error;
  }
}

/**
 * Get count of app data keys (for informational purposes)
 */
export async function getAppDataCount(): Promise<number> {
  const keys = await getAllAppKeys();
  return keys.length;
}

