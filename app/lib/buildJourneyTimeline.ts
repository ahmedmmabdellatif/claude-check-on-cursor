// buildJourneyTimeline.ts
// Pure function that maps ProgramForTracking → JourneyTimeline
// Deterministic mapping with no UI logic

import { ProgramForTracking, ProgramDay, DaySection } from '../../shared/programTrackingSchema';
import { JourneyTimeline, JourneyDay, JourneyTask, JourneyTaskCategory, JourneyTaskTimeOfDay } from '../types/journey';

export interface BuildJourneyOptions {
  startDateIso?: string; // default: today in user's timezone
  totalWeeks?: number;   // default: 4
}

/**
 * Builds a JourneyTimeline from a ProgramForTracking
 * Pure function - no side effects, deterministic output
 */
export function buildJourneyTimeline(
  program: ProgramForTracking,
  programId: string,
  options?: BuildJourneyOptions
): JourneyTimeline {
  const totalWeeks = options?.totalWeeks || 4;
  const totalDays = totalWeeks * 7;
  
  // Get start date (default to today)
  const startDate = options?.startDateIso 
    ? new Date(options.startDateIso)
    : new Date();
  startDate.setHours(0, 0, 0, 0);

  // Get base weekly pattern from logicalDays
  const baseDays = program.schedule.logicalDays || [];
  
  // If no logical days, create a simple pattern from available sections
  if (baseDays.length === 0) {
    return buildTimelineFromSections(program, programId, totalDays, startDate, options);
  }

  // Build days by repeating the weekly pattern
  const days: JourneyDay[] = [];
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const weekIndex = Math.floor(dayIndex / 7);
    const weekdayIndex = dayIndex % 7;
    
    // Use modulo to cycle through base days if we have fewer than 7
    const baseDayIndex = weekdayIndex % baseDays.length;
    const baseDay = baseDays[baseDayIndex];
    
    // Calculate date
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dateIso = date.toISOString().split('T')[0];
    
    // Build tasks from base day sections
    const tasks = buildTasksFromDay(baseDay, dayIndex, programId);
    
    // Add rest day tasks if this is a rest day (no workout sections)
    const hasWorkout = baseDay.sections.some(s => s.type === 'workout');
    if (!hasWorkout && dayIndex > 0) {
      // Add cardio, stretching, nutrition, education for rest days
      addRestDayTasks(tasks, program, dayIndex, programId);
    }
    
    days.push({
      dayIndex,
      dateIso,
      label: baseDay.label || `Day ${dayIndex + 1}`,
      tasks
    });
  }

  return {
    programId,
    title: program.meta.title || 'Fitness Program',
    startDateIso: startDate.toISOString().split('T')[0],
    totalDays,
    days
  };
}

/**
 * Build tasks from a ProgramDay's sections
 */
function buildTasksFromDay(
  programDay: ProgramDay,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  const tasks: JourneyTask[] = [];
  
  for (const section of programDay.sections) {
    switch (section.type) {
      case 'workout':
        tasks.push(...buildWorkoutTasks(section, dayIndex, programId, programDay));
        break;
      case 'cardio':
        tasks.push(...buildCardioTasks(section, dayIndex, programId));
        break;
      case 'rehab':
        tasks.push(...buildRehabTasks(section, dayIndex, programId));
        break;
      case 'warmup':
        tasks.push(...buildWarmupTasks(section, dayIndex, programId));
        break;
      case 'nutrition':
        tasks.push(...buildNutritionTasks(section, dayIndex, programId));
        break;
      case 'education':
        tasks.push(...buildEducationTasks(section, dayIndex, programId));
        break;
      // Admin sections are skipped for journey tasks
    }
  }
  
  return tasks;
}

/**
 * Build workout tasks (one per workout section)
 */
function buildWorkoutTasks(
  section: any,
  dayIndex: number,
  programId: string,
  programDay: ProgramDay
): JourneyTask[] {
  const muscleGroups = section.muscleGroups || [];
  const muscleGroupStr = muscleGroups.length > 0 ? muscleGroups.join(' & ') : 'Full Body';
  
  return [{
    id: `${programId}:day${dayIndex}:workout:${section.id}`,
    category: 'workout' as JourneyTaskCategory,
    title: `Workout – ${muscleGroupStr}`,
    description: section.notes || undefined,
    timeOfDay: 'midday' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {
      workoutDayLabel: programDay.label,
      muscleGroups: muscleGroups,
      sets: section.exercises?.length || 0,
    },
    ref: {
      sourceKind: 'workout_day',
      sourceId: `${programDay.id}:${section.id}`
    }
  }];
}

/**
 * Build cardio tasks (one per session)
 */
function buildCardioTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  if (!section.sessions || section.sessions.length === 0) {
    return [];
  }
  
  return section.sessions.map((session: any, idx: number) => ({
    id: `${programId}:day${dayIndex}:cardio:${section.id}:${idx}`,
    category: 'cardio' as JourneyTaskCategory,
    title: `Cardio – ${session.name}${session.durationMinutes ? ` (${session.durationMinutes} min)` : ''}`,
    description: session.intensity || session.heartRateRange || undefined,
    timeOfDay: 'evening' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {
      durationMinutes: session.durationMinutes,
    },
    ref: {
      sourceKind: 'cardio_block',
      sourceId: `${section.id}:session:${idx}`
    }
  }));
}

/**
 * Build rehab tasks
 */
function buildRehabTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  return [{
    id: `${programId}:day${dayIndex}:rehab:${section.id}`,
    category: 'rehab' as JourneyTaskCategory,
    title: `Rehab – ${section.targetArea || 'Mobility'}`,
    description: section.notes || undefined,
    timeOfDay: 'morning' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {},
    ref: {
      sourceKind: 'rehab_block',
      sourceId: section.id
    }
  }];
}

/**
 * Build warmup tasks
 */
function buildWarmupTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  return [{
    id: `${programId}:day${dayIndex}:warmup:${section.id}`,
    category: 'mobility' as JourneyTaskCategory,
    title: `Warm-up (${section.exercises?.length || 0} exercises)`,
    description: section.notes || 'Pre-workout warm-up routine',
    timeOfDay: 'morning' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {},
    ref: {
      sourceKind: 'rehab_block',
      sourceId: section.id
    }
  }];
}

/**
 * Build stretching tasks
 */
function buildStretchingTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  return [{
    id: `${programId}:day${dayIndex}:stretching:${section.id}`,
    category: 'stretching' as JourneyTaskCategory,
    title: `Stretching (${section.exercises?.length || 0} exercises)`,
    description: section.notes || 'Post-workout stretching routine',
    timeOfDay: 'evening' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {},
    ref: {
      sourceKind: 'stretch_block',
      sourceId: section.id
    }
  }];
}

/**
 * Build nutrition tasks (one per day)
 */
function buildNutritionTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  const mealCount = section.meals?.length || 0;
  return [{
    id: `${programId}:day${dayIndex}:nutrition`,
    category: 'nutrition' as JourneyTaskCategory,
    title: `Follow meal plan (${mealCount} meals)`,
    description: 'Track your meals and portions',
    timeOfDay: 'anytime' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {
      caloriesTarget: undefined, // Could extract from nutritionOverview
    },
    ref: {
      sourceKind: 'nutrition_meal',
      sourceId: `day${dayIndex}`
    }
  }];
}

/**
 * Build education tasks (distributed across early days)
 */
function buildEducationTasks(
  section: any,
  dayIndex: number,
  programId: string
): JourneyTask[] {
  // Only add education tasks in first week
  if (dayIndex >= 7) {
    return [];
  }
  
  if (!section.items || section.items.length === 0) {
    return [];
  }
  
  // Distribute education items across first week
  const itemIndex = dayIndex % section.items.length;
  const item = section.items[itemIndex];
  
  return [{
    id: `${programId}:day${dayIndex}:education:${section.id}:${itemIndex}`,
    category: 'education' as JourneyTaskCategory,
    title: item.title || 'Read guidelines',
    description: item.text.substring(0, 100) + (item.text.length > 100 ? '...' : ''),
    timeOfDay: 'anytime' as JourneyTaskTimeOfDay,
    dayIndex,
    meta: {},
    ref: {
      sourceKind: 'education_item',
      sourceId: `${section.id}:${itemIndex}`
    }
  }];
}

/**
 * Add rest day tasks (cardio, stretching, nutrition, education)
 */
function addRestDayTasks(
  tasks: JourneyTask[],
  program: ProgramForTracking,
  dayIndex: number,
  programId: string
): void {
  // Add stretching task for rest days
  const stretchingSections = program.schedule.logicalDays
    .flatMap(d => d.sections.filter(s => s.type === 'stretching' || (s.type === 'rehab' && (s as any).targetArea?.toLowerCase().includes('stretch'))))
    .slice(0, 1);
  
  if (stretchingSections.length > 0) {
    const section = stretchingSections[0];
    tasks.push({
      id: `${programId}:day${dayIndex}:stretching:${section.id}`,
      category: 'stretching' as JourneyTaskCategory,
      title: 'Post-workout stretching',
      description: section.notes || 'Stretching routine',
      timeOfDay: 'evening' as JourneyTaskTimeOfDay,
      dayIndex,
      meta: {},
      ref: {
        sourceKind: 'stretch_block',
        sourceId: section.id
      }
    });
  }
  
  // Add nutrition task if not already present
  const hasNutrition = tasks.some(t => t.category === 'nutrition');
  if (!hasNutrition && program.nutritionOverview) {
    tasks.push({
      id: `${programId}:day${dayIndex}:nutrition`,
      category: 'nutrition' as JourneyTaskCategory,
      title: 'Follow meal plan',
      description: 'Track your meals',
      timeOfDay: 'anytime' as JourneyTaskTimeOfDay,
      dayIndex,
      meta: {},
      ref: {
        sourceKind: 'nutrition_meal',
        sourceId: `day${dayIndex}`
      }
    });
  }
}

/**
 * Fallback: Build timeline from sections if no logicalDays structure
 */
function buildTimelineFromSections(
  program: ProgramForTracking,
  programId: string,
  totalDays: number,
  startDate: Date,
  options?: BuildJourneyOptions
): JourneyTimeline {
  const days: JourneyDay[] = [];
  
  // Extract all sections from all days
  const allSections = program.schedule.logicalDays.flatMap(d => d.sections);
  
  // Group by type
  const workoutSections = allSections.filter(s => s.type === 'workout');
  const cardioSections = allSections.filter(s => s.type === 'cardio');
  const rehabSections = allSections.filter(s => s.type === 'rehab' || s.type === 'warmup');
  
  // Create a simple pattern: workout days on 0, 2, 4, rest on 1, 3, 5, 6
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayIndex);
    const dateIso = date.toISOString().split('T')[0];
    
    const tasks: JourneyTask[] = [];
    const isWorkoutDay = dayIndex % 7 < 5 && dayIndex % 2 === 0;
    
    if (isWorkoutDay && workoutSections.length > 0) {
      const section = workoutSections[dayIndex % workoutSections.length];
      tasks.push(...buildWorkoutTasks(section, dayIndex, programId, {
        id: `day-${dayIndex + 1}`,
        label: `Day ${dayIndex + 1}`,
        tags: [],
        sections: []
      }));
    }
    
    // Add nutrition for all days
    if (program.nutritionOverview) {
      tasks.push({
        id: `${programId}:day${dayIndex}:nutrition`,
        category: 'nutrition',
        title: 'Follow meal plan',
        timeOfDay: 'anytime',
        dayIndex,
        ref: {
          sourceKind: 'nutrition_meal',
          sourceId: `day${dayIndex}`
        }
      });
    }
    
    days.push({
      dayIndex,
      dateIso,
      label: `Day ${dayIndex + 1}`,
      tasks
    });
  }
  
  return {
    programId,
    title: program.meta.title || 'Fitness Program',
    startDateIso: startDate.toISOString().split('T')[0],
    totalDays,
    days
  };
}

