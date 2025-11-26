// journeyStorage.ts
// Storage helpers for journey timeline

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyTimeline } from '../types/journey';

const JOURNEY_KEY_PREFIX = 'journey:';

/**
 * Save journey timeline
 */
export async function saveJourneyTimeline(
  programId: string,
  timeline: JourneyTimeline
): Promise<void> {
  try {
    const key = `${JOURNEY_KEY_PREFIX}${programId}`;
    await AsyncStorage.setItem(key, JSON.stringify(timeline));
  } catch (error) {
    console.error('[journeyStorage] Error saving timeline:', error);
  }
}

/**
 * Load journey timeline
 */
export async function loadJourneyTimeline(
  programId: string
): Promise<JourneyTimeline | null> {
  try {
    const key = `${JOURNEY_KEY_PREFIX}${programId}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[journeyStorage] Error loading timeline:', error);
    return null;
  }
}

/**
 * Clear journey timeline
 */
export async function clearJourneyTimeline(programId: string): Promise<void> {
  try {
    const key = `${JOURNEY_KEY_PREFIX}${programId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[journeyStorage] Error clearing timeline:', error);
  }
}

