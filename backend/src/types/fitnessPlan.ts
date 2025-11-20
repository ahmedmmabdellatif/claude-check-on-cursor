export interface UniversalFitnessPlan {
  meta?: {
    plan_name?: string;
    coach_name?: string;
    duration_weeks?: string;
    title?: string;
    [key: string]: any;
  };
  profile?: {
    trainee_name?: string;
    age?: string | number;
    gender?: string;
    height_cm?: string | number;
    weight_kg?: string | number;
    location?: string;
    goals?: string[];
    notes?: string[];
    [key: string]: any;
  };
  assessment_and_background?: {
    demographics?: any;
    health_status?: {
      medical_conditions?: string[];
      injuries?: string[];
      pain_points?: string[];
      posture_issues?: string[];
      mobility_limitations?: string[];
      rehab_history?: string[];
      [key: string]: any;
    };
    fitness_status?: {
      experience_level?: string;
      training_history?: string;
      weak_points?: string[];
      strong_points?: string[];
      [key: string]: any;
    };
    monitoring_and_tracking?: {
      body_measurements?: string[];
      weekly_metrics?: string[];
      progress_evaluation?: string[];
      [key: string]: any;
    };
    behavior_and_psychology?: {
      motivation_notes?: string[];
      adherence_notes?: string[];
      mindset_notes?: string[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  warmup_protocols?: any[];
  mobility_and_rehab?: any[];
  stretching_routines?: any[];
  cardio_sessions?: any[];
  weekly_schedule?: any[];
  workouts?: any[];
  nutrition_plan?: any[];
  food_sources?: {
    [key: string]: string[] | any;
  };
  education_and_guidelines?: any[];
  other_information?: any[];
  unclassified?: any[];
  debug?: Debug;
  [key: string]: any;
}

export type PageParseResponse = UniversalFitnessPlan;

export interface PageSummary {
  page_number: number;
  raw_text: string;
  detected_elements?: string[];
  mapped_to?: string[];
  notes?: string;
}

export interface Debug {
  pages: PageSummary[];
}
