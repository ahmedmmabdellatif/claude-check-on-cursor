// programTrackingSchema.ts
// Shared TypeScript schema for normalized, calendar-ready, tracking-first program representation
// Used by both backend (normalization) and frontend (UI rendering)
// This is the single source of truth for the tracking UI layer

/**
 * Top-level program structure optimized for daily tracking and calendar integration
 */
export interface ProgramForTracking {
  meta: {
    title: string;
    subtitle?: string;
    author?: string;
    sourcePdfName?: string;
  };

  profile: {
    traineeName: string;
    age?: string;
    gender?: string;
    heightCm?: string;
    weightKg?: string;
    location?: string;
    goals: string[];
    keyInjuries: string[];
    keyNotes: string[];
  };

  schedule: {
    // Logical days (Day 1, Day 2, etc.) - app can map to real dates later
    logicalDays: ProgramDay[];
  };

  // Optional global references
  nutritionOverview?: NutritionOverview;
  education?: EducationItem[];

  debugRef?: {
    sourcePlanType: "UniversalFitnessPlan";
    rawPlanId?: string;
  };
}

/**
 * Represents a single day in the program schedule
 */
export interface ProgramDay {
  id: string;          // "day-1", "day-2", etc.
  label: string;       // "Day 1 – Chest/Triceps", etc.
  tags: string[];      // ["chest", "triceps", "strength"], etc.
  sections: DaySection[];
}

/**
 * Union type for all possible day sections
 */
export type DaySection =
  | WorkoutSection
  | CardioSection
  | NutritionSection
  | RehabSection
  | WarmupSection
  | EducationSection
  | AdminSection;

/**
 * Base interface for all section types
 */
export interface BaseSection {
  id: string;
  type:
    | "workout"
    | "cardio"
    | "nutrition"
    | "rehab"
    | "warmup"
    | "education"
    | "admin";
  title: string;
  notes?: string;
}

/**
 * Workout section with trackable exercises
 */
export interface WorkoutSection extends BaseSection {
  type: "workout";
  muscleGroups: string[];        // ["Chest", "Triceps"]
  exercises: TrackableExercise[];
}

/**
 * Trackable exercise with tracking template
 */
export interface TrackableExercise {
  id: string;
  name: string;
  sets: number | null;
  reps: string | null;           // "8–12", "4x10", etc.
  tempo?: string | null;
  restSeconds?: number | null;
  equipment?: string | null;
  muscles?: string[];
  mediaLinks?: string[];
  sourceRefs?: SourceRef[];
  trackingTemplate: {
    trackWeightKg?: boolean;
    trackReps?: boolean;
    trackSets?: boolean;
    trackTempo?: boolean;
    trackRpe?: boolean;
    trackCompletedCheckbox?: boolean;
  };
}

/**
 * Cardio section with trackable sessions
 */
export interface CardioSection extends BaseSection {
  type: "cardio";
  sessions: {
    name: string;          // "Treadmill"
    durationMinutes: number | null;
    intensity?: string | null;
    heartRateRange?: string | null;
    weeklyProgressionNote?: string | null;
    trackingTemplate: {
      trackDuration?: boolean;
      trackDistance?: boolean;
      trackRpe?: boolean;
      trackCompletedCheckbox?: boolean;
    };
  }[];
}

/**
 * Nutrition section with trackable meals
 */
export interface NutritionSection extends BaseSection {
  type: "nutrition";
  meals: {
    id: string;
    label: string;           // "Meal 1", "Snack", etc.
    options: {
      id: string;
      label: string;         // e.g. "Option 1"
      items: {
        name: string;
        amount?: string;     // "200g", "1 scoop"
      }[];
    }[];
    trackingTemplate: {
      trackCompletedCheckbox?: boolean;
      trackPortionMultiplier?: boolean; // ate 0.5x, 1x, 1.5x, etc.
    };
  }[];
}

/**
 * Rehab section with target area and exercises
 */
export interface RehabSection extends BaseSection {
  type: "rehab";
  targetArea: string;         // "knee", "lower back", "flat foot"
  exercises: TrackableExercise[];
}

/**
 * Warmup section with exercises
 */
export interface WarmupSection extends BaseSection {
  type: "warmup";
  exercises: TrackableExercise[];
}

/**
 * Education section with informational items
 */
export interface EducationSection extends BaseSection {
  type: "education";
  items: {
    title?: string;
    text: string;
    sourceRefs?: SourceRef[];
  }[];
}

/**
 * Admin section for miscellaneous items
 */
export interface AdminSection extends BaseSection {
  type: "admin";
  items: {
    title: string;
    text: string;
  }[];
}

/**
 * Nutrition overview with totals
 */
export interface NutritionOverview {
  totalCalories?: number | null;
  macros?: {
    carbsG?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
  };
}

/**
 * Education item
 */
export interface EducationItem {
  title?: string;
  text: string;
}

/**
 * Reference to source location in original plan
 */
export interface SourceRef {
  pageNumber?: number;
  sectionHint?: string;   // e.g. "weekly_schedule", "workouts.Day 1"
}

