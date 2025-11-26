# Empty Fitness Plan Template Structure

This document defines the **complete empty template** that matches the Cloudflare Worker's Universal Fitness Schema. This template is used by the app to display and track parsed PDF data.

---

## Template Structure (Matching Worker Schema)

```typescript
interface UniversalFitnessPlan {
  // ============================================
  // SECTION 1: METADATA
  // ============================================
  meta: {
    title: "";              // Plan name/title
    subtitle: "";           // Subtitle or description
    author: "";             // Coach/creator name
    creation_date: "";      // When plan was created
    source: "";             // Source PDF filename
  };

  // ============================================
  // SECTION 2: PROFILE
  // ============================================
  profile: {
    trainee_name: "";       // Client name
    age: "";                // Age
    gender: "";             // Gender
    height_cm: "";          // Height in cm
    weight_kg: "";          // Weight in kg
    location: "";           // Location
    goals: [];              // Array of fitness goals
    notes: [];              // General notes
  };

  // ============================================
  // SECTION 3: ASSESSMENT & BACKGROUND
  // ============================================
  assessment_and_background: {
    demographics: {};        // Demographic data
    
    health_status: {
      medical_conditions: [];   // Medical conditions
      injuries: [];             // Current/past injuries
      pain_points: [];          // Areas of pain
      posture_issues: [];       // Posture problems
      mobility_limitations: [];  // Mobility restrictions
      rehab_history: [];         // Rehabilitation history
    };
    
    fitness_status: {
      experience_level: "";      // Beginner/Intermediate/Advanced
      training_history: "";      // Training background
      weak_points: [];            // Weak areas
      strong_points: [];          // Strong areas
    };
    
    monitoring_and_tracking: {
      body_measurements: [];      // Body measurements
      weekly_metrics: [];         // Weekly tracking data
      progress_evaluation: [];    // Progress notes
    };
    
    behavior_and_psychology: {
      motivation_notes: [];      // Motivation tips
      adherence_notes: [];        // Adherence tracking
      mindset_notes: [];          // Mindset guidance
    };
  };

  // ============================================
  // SECTION 4: TRAINING PROTOCOLS
  // ============================================
  warmup_protocols: [];           // Warm-up routines
  mobility_and_rehab: [];         // Mobility & rehabilitation exercises
  stretching_routines: [];        // Stretching exercises
  cardio_sessions: [];            // Cardio workouts
  weekly_schedule: [];            // Weekly training schedule
  workouts: Workout[];            // Strength training workouts

  // ============================================
  // SECTION 5: NUTRITION
  // ============================================
  nutrition_plan: [];             // Meal plans
  food_sources: {};               // Food categorization (proteins, carbs, etc.)

  // ============================================
  // SECTION 6: SUPPLEMENTS & HEALTH
  // ============================================
  supplements: [];                 // Supplement recommendations

  // ============================================
  // SECTION 7: EDUCATION & GUIDANCE
  // ============================================
  education_and_guidelines: [];   // Educational content
  other_information: [];           // Other relevant info

  // ============================================
  // SECTION 8: UNCLASSIFIED
  // ============================================
  unclassified: [];                // Content that doesn't fit other categories

  // ============================================
  // SECTION 9: DEBUG (Development)
  // ============================================
  debug: {
    pages: [                      // Page-by-page extraction info
      {
        page_number: number;
        raw_text: string;
        detected_elements: string[];
        mapped_to: string[];
        notes: string;
      }
    ];
  };
}
```

---

## Workout Structure (Nested in workouts[])

```typescript
interface Workout {
  name: string;                    // "Push Day", "Legs", "Day 1"
  day_label?: string;              // "Monday", "Day 1"
  exercises: Exercise[];
  notes?: string;
}

interface Exercise {
  name: string;                    // "Bench Press"
  sets?: string | number;          // "3" or 3
  reps?: string | number;          // "10" or "10-12"
  tempo?: string;                  // "2-0-1-0"
  rest?: string;                   // "90s" or "2min"
  equipment?: string;              // "Barbell", "Dumbbells"
  muscles?: string[];              // ["Chest", "Triceps"]
  instructions?: string;           // Form cues
  media_link?: string;             // Video/image URL
  notes?: string;                  // Exercise-specific notes
}
```

---

## Empty Template Initialization

When the app starts or receives a new plan, it initializes with this structure:

```typescript
const emptyTemplate: UniversalFitnessPlan = {
  meta: {
    title: "",
    subtitle: "",
    author: "",
    creation_date: "",
    source: ""
  },
  profile: {
    trainee_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    location: "",
    goals: [],
    notes: []
  },
  assessment_and_background: {
    demographics: {},
    health_status: {
      medical_conditions: [],
      injuries: [],
      pain_points: [],
      posture_issues: [],
      mobility_limitations: [],
      rehab_history: []
    },
    fitness_status: {
      experience_level: "",
      training_history: "",
      weak_points: [],
      strong_points: []
    },
    monitoring_and_tracking: {
      body_measurements: [],
      weekly_metrics: [],
      progress_evaluation: []
    },
    behavior_and_psychology: {
      motivation_notes: [],
      adherence_notes: [],
      mindset_notes: []
    }
  },
  warmup_protocols: [],
  mobility_and_rehab: [],
  stretching_routines: [],
  cardio_sessions: [],
  weekly_schedule: [],
  workouts: [],
  nutrition_plan: [],
  food_sources: {},
  education_and_guidelines: [],
  other_information: [],
  unclassified: [],
  debug: {
    pages: []
  }
};
```

---

## How Template Gets Filled

1. **User uploads PDF** → Backend processes → Returns `fitnessPlan` JSON
2. **App receives JSON** → Maps to template structure
3. **For each section:**
   - If data exists → Display in UI component
   - If data missing → Show empty state message
4. **User can:**
   - View all parsed data
   - Track progress (check off exercises, log meals, etc.)
   - Edit/add information
   - Save changes locally

---

## UI Components Mapping

| Template Section | UI Component | Location |
|-----------------|--------------|----------|
| `meta` + `profile` | `OverviewSection` | `components/fitness/OverviewSection.tsx` |
| `workouts[]` | `WorkoutsSection` | `components/fitness/WorkoutsSection.tsx` |
| `nutrition_plan[]` | `NutritionSection` | `components/fitness/NutritionSection.tsx` |
| `cardio_sessions[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `mobility_and_rehab[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `stretching_routines[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `supplements[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `education_and_guidelines[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `other_information[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `unclassified[]` | `GenericSection` | `components/fitness/GenericSection.tsx` |
| `debug.pages[]` | `DebugSection` | `components/screens/FitnessPlanScreen.tsx` |

---

## Notes

- **All sections are optional** - PDFs may not contain all sections
- **Empty arrays/objects are valid** - Show "No data found" message
- **Template matches Worker output** - No transformation needed
- **User can edit** - Template is editable after parsing
- **Offline support** - Template saved to AsyncStorage

