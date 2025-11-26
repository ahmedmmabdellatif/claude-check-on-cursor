// journey.ts
// Journey timeline data model for daily task tracking
// Maps ProgramForTracking to a calendar-ready timeline with trackable tasks

export type JourneyTaskCategory =
  | "workout"
  | "cardio"
  | "rehab"
  | "mobility"
  | "stretching"
  | "nutrition"
  | "education"
  | "checkin";

export type JourneyTaskTimeOfDay = "morning" | "midday" | "evening" | "anytime";

export interface JourneyTaskRef {
  sourceKind:
    | "workout_day"
    | "cardio_block"
    | "rehab_block"
    | "stretch_block"
    | "nutrition_meal"
    | "education_item";
  sourceId: string; // stable, derived from ProgramForTracking (e.g. "day1:chest:incline-press")
}

export interface JourneyTask {
  id: string; // stable deterministic ID using dayIndex + sourceId
  category: JourneyTaskCategory;
  title: string; // short label (e.g. "Workout – Chest & Triceps", "Cardio – Treadmill 20 min")
  description?: string; // optional details
  timeOfDay: JourneyTaskTimeOfDay;
  dayIndex: number; // 0-based offset from program start
  meta?: {
    workoutDayLabel?: string;   // e.g. "Day 1 – Chest & Triceps"
    muscleGroups?: string[];
    sets?: number;
    reps?: string | number;
    tempo?: string;
    rest?: string;
    durationMinutes?: number;
    caloriesTarget?: number;
  };
  ref: JourneyTaskRef;
}

export interface JourneyDay {
  dayIndex: number; // 0 = Day 1
  dateIso?: string; // optional, derived from selected start date
  label: string;    // e.g. "Day 1", "Day 2 (Legs)", etc.
  tasks: JourneyTask[];
}

export interface JourneyTimeline {
  programId: string; // tie back to parsed plan ID / domain ID
  title: string;
  startDateIso?: string; // chosen by user (default = today)
  totalDays: number;
  days: JourneyDay[];
}

// Progress tracking
export interface JourneyTaskProgress {
  completed: boolean;
  completedAtIso?: string;
  trackedData?: {
    weightKg?: number;
    reps?: number;
    sets?: number;
    rpe?: number;
    duration?: number;
    distance?: number;
    portionMultiplier?: number;
  };
}

export interface JourneyProgress {
  [taskId: string]: JourneyTaskProgress;
}

// Adherence & Progress Types
export type DayAdherenceLevel = 'none' | 'low' | 'medium' | 'high';

export interface DayAdherenceMetrics {
  dateKey: string; // 'YYYY-MM-DD' aligned with JourneyDay
  dayIndex: number;
  plannedTasks: number;
  completedTasks: number;
  completionRate: number; // 0–1
  categories: {
    [category in JourneyTaskCategory]?: {
      planned: number;
      completed: number;
      completionRate: number; // 0–1
    };
  };
  adherenceLevel: DayAdherenceLevel;
}

export interface StreakInfo {
  currentStreakDays: number;
  bestStreakDays: number;
  streakThreshold: number; // e.g. 0.6 (60% completion)
}

export interface AdherenceSummary {
  overallCompletionRate: number; // for the entire program duration
  last7DaysCompletionRate: number;
  last30DaysCompletionRate: number;
  dayMetrics: DayAdherenceMetrics[];
  categorySummary: {
    [category in JourneyTaskCategory]?: {
      planned: number;
      completed: number;
      completionRate: number;
    };
  };
  streakInfo: StreakInfo;
  redFlags: {
    dateKey: string;
    dayIndex: number;
    completionRate: number;
  }[];
}

