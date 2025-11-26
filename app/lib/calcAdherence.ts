// calcAdherence.ts
// Pure function to calculate adherence metrics from JourneyTimeline + JourneyProgress

import { JourneyTimeline, JourneyProgress, JourneyTaskCategory, AdherenceSummary, DayAdherenceMetrics, DayAdherenceLevel, StreakInfo } from '../types/journey';

const STREAK_THRESHOLD = 0.6; // 60% completion required for streak
const RED_FLAG_THRESHOLD = 0.4; // < 40% completion is a red flag

/**
 * Determine adherence level from completion rate
 */
function getAdherenceLevel(completionRate: number): DayAdherenceLevel {
  if (completionRate === 0) return 'none';
  if (completionRate < 0.4) return 'low';
  if (completionRate < 0.8) return 'medium';
  return 'high';
}

/**
 * Get date key from day (YYYY-MM-DD format)
 */
function getDateKey(dayIndex: number, startDateIso?: string): string {
  if (!startDateIso) {
    // If no start date, use a relative date key based on dayIndex
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  }
  
  const startDate = new Date(startDateIso);
  startDate.setDate(startDate.getDate() + dayIndex);
  return startDate.toISOString().split('T')[0];
}

/**
 * Check if a date is within the last N days from today
 */
function isWithinLastNDays(dateKey: string, n: number, today: Date): boolean {
  const date = new Date(dateKey);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < n;
}

/**
 * Calculate adherence summary from timeline and progress
 * Pure function - no side effects, deterministic output
 */
export function calcAdherenceSummary(
  timeline: JourneyTimeline,
  progress: JourneyProgress,
  today: Date = new Date()
): AdherenceSummary {
  // Normalize today to start of day
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);
  
  // Calculate day-level metrics
  const dayMetrics: DayAdherenceMetrics[] = [];
  
  for (const day of timeline.days) {
    const dateKey = getDateKey(day.dayIndex, timeline.startDateIso);
    const tasks = day.tasks;
    const plannedTasks = tasks.length;
    
    // Count completed tasks
    let completedTasks = 0;
    const categoryCounts: Record<JourneyTaskCategory, { planned: number; completed: number }> = {
      workout: { planned: 0, completed: 0 },
      cardio: { planned: 0, completed: 0 },
      rehab: { planned: 0, completed: 0 },
      mobility: { planned: 0, completed: 0 },
      stretching: { planned: 0, completed: 0 },
      nutrition: { planned: 0, completed: 0 },
      education: { planned: 0, completed: 0 },
      checkin: { planned: 0, completed: 0 },
    };
    
    for (const task of tasks) {
      const isCompleted = progress[task.id]?.completed || false;
      if (isCompleted) {
        completedTasks++;
      }
      
      // Count by category
      if (categoryCounts[task.category]) {
        categoryCounts[task.category].planned++;
        if (isCompleted) {
          categoryCounts[task.category].completed++;
        }
      }
    }
    
    const completionRate = plannedTasks > 0 ? completedTasks / plannedTasks : 0;
    const adherenceLevel = getAdherenceLevel(completionRate);
    
    // Build category metrics
    const categoryMetrics: DayAdherenceMetrics['categories'] = {};
    for (const [category, counts] of Object.entries(categoryCounts) as [JourneyTaskCategory, { planned: number; completed: number }][]) {
      if (counts.planned > 0) {
        categoryMetrics[category] = {
          planned: counts.planned,
          completed: counts.completed,
          completionRate: counts.completed / counts.planned,
        };
      }
    }
    
    dayMetrics.push({
      dateKey,
      dayIndex: day.dayIndex,
      plannedTasks,
      completedTasks,
      completionRate,
      categories: categoryMetrics,
      adherenceLevel,
    });
  }
  
  // Calculate overall metrics
  const allPlanned = dayMetrics.reduce((sum, d) => sum + d.plannedTasks, 0);
  const allCompleted = dayMetrics.reduce((sum, d) => sum + d.completedTasks, 0);
  const overallCompletionRate = allPlanned > 0 ? allCompleted / allPlanned : 0;
  
  // Calculate last 7 and 30 days
  const last7Days = dayMetrics.filter(d => isWithinLastNDays(d.dateKey, 7, todayNormalized));
  const last30Days = dayMetrics.filter(d => isWithinLastNDays(d.dateKey, 30, todayNormalized));
  
  const last7DaysPlanned = last7Days.reduce((sum, d) => sum + d.plannedTasks, 0);
  const last7DaysCompleted = last7Days.reduce((sum, d) => sum + d.completedTasks, 0);
  const last7DaysCompletionRate = last7DaysPlanned > 0 ? last7DaysCompleted / last7DaysPlanned : 0;
  
  const last30DaysPlanned = last30Days.reduce((sum, d) => sum + d.plannedTasks, 0);
  const last30DaysCompleted = last30Days.reduce((sum, d) => sum + d.completedTasks, 0);
  const last30DaysCompletionRate = last30DaysPlanned > 0 ? last30DaysCompleted / last30DaysPlanned : 0;
  
  // Calculate category summary (across all days)
  const categorySummary: AdherenceSummary['categorySummary'] = {};
  const categoryTotals: Record<JourneyTaskCategory, { planned: number; completed: number }> = {
    workout: { planned: 0, completed: 0 },
    cardio: { planned: 0, completed: 0 },
    rehab: { planned: 0, completed: 0 },
    mobility: { planned: 0, completed: 0 },
    stretching: { planned: 0, completed: 0 },
    nutrition: { planned: 0, completed: 0 },
    education: { planned: 0, completed: 0 },
    checkin: { planned: 0, completed: 0 },
  };
  
  for (const day of timeline.days) {
    for (const task of day.tasks) {
      categoryTotals[task.category].planned++;
      if (progress[task.id]?.completed) {
        categoryTotals[task.category].completed++;
      }
    }
  }
  
  for (const [category, totals] of Object.entries(categoryTotals) as [JourneyTaskCategory, { planned: number; completed: number }][]) {
    if (totals.planned > 0) {
      categorySummary[category] = {
        planned: totals.planned,
        completed: totals.completed,
        completionRate: totals.completed / totals.planned,
      };
    }
  }
  
  // Calculate streaks
  // Sort days by date key (chronological)
  const sortedDays = [...dayMetrics].sort((a, b) => {
    const dateA = new Date(a.dateKey).getTime();
    const dateB = new Date(b.dateKey).getTime();
    return dateA - dateB;
  });
  
  let currentStreakDays = 0;
  let bestStreakDays = 0;
  let tempStreak = 0;
  
  // Calculate current streak (from most recent day backwards)
  for (let i = sortedDays.length - 1; i >= 0; i--) {
    const day = sortedDays[i];
    // Only count days that are today or in the past
    const dayDate = new Date(day.dateKey);
    dayDate.setHours(0, 0, 0, 0);
    if (dayDate > todayNormalized) continue;
    
    if (day.completionRate >= STREAK_THRESHOLD) {
      currentStreakDays++;
    } else {
      break; // Streak broken
    }
  }
  
  // Calculate best streak
  for (const day of sortedDays) {
    const dayDate = new Date(day.dateKey);
    dayDate.setHours(0, 0, 0, 0);
    // Only count days that are today or in the past
    if (dayDate > todayNormalized) continue;
    
    if (day.completionRate >= STREAK_THRESHOLD) {
      tempStreak++;
      bestStreakDays = Math.max(bestStreakDays, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  const streakInfo: StreakInfo = {
    currentStreakDays,
    bestStreakDays,
    streakThreshold: STREAK_THRESHOLD,
  };
  
  // Calculate red flags
  const redFlags: AdherenceSummary['redFlags'] = [];
  for (const day of sortedDays) {
    const dayDate = new Date(day.dateKey);
    dayDate.setHours(0, 0, 0, 0);
    // Only count days that are today or in the past
    if (dayDate > todayNormalized) continue;
    
    if (day.completionRate < RED_FLAG_THRESHOLD && day.plannedTasks > 0) {
      redFlags.push({
        dateKey: day.dateKey,
        dayIndex: day.dayIndex,
        completionRate: day.completionRate,
      });
    }
  }
  
  return {
    overallCompletionRate,
    last7DaysCompletionRate: last7DaysCompletionRate,
    last30DaysCompletionRate: last30DaysCompletionRate,
    dayMetrics,
    categorySummary,
    streakInfo,
    redFlags,
  };
}

