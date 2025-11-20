export interface UniversalFitnessPlan {
  meta: {
    title: string;
    subtitle: string;
    author: string;
    creation_date: string;
    source: string;
  };

  profile: {
    trainee_name: string;
    age: string | number;
    gender: string;
    height_cm: string | number;
    weight_kg: string | number;
    location: string;
    goals: string[];
    notes: string[];
  };

  assessment_and_background: {
    demographics: any;
    health_status: {
      medical_conditions: string[];
      injuries: string[];
      pain_points: string[];
      posture_issues: string[];
      mobility_limitations: string[];
      rehab_history: string[];
    };
    fitness_status: {
      experience_level: string;
      training_history: string;
      weak_points: string[];
      strong_points: string[];
    };
    monitoring_and_tracking: {
      body_measurements: string[];
      weekly_metrics: string[];
      progress_evaluation: string[];
    };
    behavior_and_psychology: {
      motivation_notes: string[];
      adherence_notes: string[];
      mindset_notes: string[];
    };
  };

  warmup_protocols: any[];
  mobility_and_rehab: any[];
  stretching_routines: any[];
  cardio_sessions: any[];
  weekly_schedule: any[];
  workouts: Workout[];
  nutrition_plan: any[];
  food_sources: any;
  education_and_guidelines: string[];
  other_information: any[];
  unclassified: any[];

  debug: {
    pages: DebugPage[];
  };
}

export interface Workout {
  name: string;
  day_label?: string;
  exercises: Exercise[];
  notes?: string;
}

export interface Exercise {
  name: string;
  sets?: string | number;
  reps?: string | number;
  tempo?: string;
  rest?: string;
  equipment?: string;
  muscles?: string[];
  instructions?: string;
  media_link?: string;
  notes?: string;
}

export interface DebugPage {
  page_number: number;
  raw_text: string;
  detected_elements: string[];
  mapped_to: string[];
  notes: string;
}

// Response from the upload endpoint
export interface UploadResponse {
  planId: string;
  meta: any;
  pagesCount: number;
  status: string;
  createdAt: string;
}
