// journeyProgress.ts
// Storage helpers for journey progress tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JourneyTaskProgress, JourneyProgress } from '../types/journey';

const PROGRESS_KEY_PREFIX = 'journeyProgress:';

/**
 * Get progress for a program
 */
export async function getJourneyProgress(programId: string): Promise<JourneyProgress> {
  try {
    const key = `${PROGRESS_KEY_PREFIX}${programId}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) {
      return {};
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[journeyProgress] Error loading progress:', error);
    return {};
  }
}

/**
 * Toggle task completion
 */
export async function toggleTaskCompletion(
  programId: string,
  taskId: string
): Promise<boolean> {
  try {
    const progress = await getJourneyProgress(programId);
    const current = progress[taskId];
    const newCompleted = !current?.completed;
    
    progress[taskId] = {
      completed: newCompleted,
      completedAtIso: newCompleted ? new Date().toISOString() : undefined,
      trackedData: current?.trackedData || {}
    };
    
    const key = `${PROGRESS_KEY_PREFIX}${programId}`;
    await AsyncStorage.setItem(key, JSON.stringify(progress));
    
    return newCompleted;
  } catch (error) {
    console.error('[journeyProgress] Error toggling completion:', error);
    return false;
  }
}

/**
 * Check if task is completed
 */
export async function isTaskCompleted(
  programId: string,
  taskId: string
): Promise<boolean> {
  try {
    const progress = await getJourneyProgress(programId);
    return progress[taskId]?.completed || false;
  } catch (error) {
    return false;
  }
}

/**
 * Update tracked data for a task
 */
export async function updateTaskTrackedData(
  programId: string,
  taskId: string,
  trackedData: Partial<JourneyTaskProgress['trackedData']>
): Promise<void> {
  try {
    const progress = await getJourneyProgress(programId);
    const current = progress[taskId] || { completed: false };
    
    progress[taskId] = {
      ...current,
      trackedData: {
        ...current.trackedData,
        ...trackedData
      }
    };
    
    const key = `${PROGRESS_KEY_PREFIX}${programId}`;
    await AsyncStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('[journeyProgress] Error updating tracked data:', error);
  }
}

/**
 * Clear all progress for a program
 */
export async function clearJourneyProgress(programId: string): Promise<void> {
  try {
    const key = `${PROGRESS_KEY_PREFIX}${programId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[journeyProgress] Error clearing progress:', error);
  }
}

