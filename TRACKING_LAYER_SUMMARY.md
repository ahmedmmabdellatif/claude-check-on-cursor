# Tracking Layer Implementation - Summary

## Files Changed

### Shared Schema (NEW)
- `shared/programTrackingSchema.ts` - TypeScript types for ProgramForTracking

### Backend (5 files)
- `backend/src/services/normalizePlan.service.ts` (NEW) - OpenAI normalization service
- `backend/src/db/job-schema.ts` - Added normalizedJson field and migration
- `backend/src/services/parseJob.service.ts` - Added normalization step after merge
- `backend/src/controllers/parse.controller.ts` - Returns normalizedPlan in API response
- `backend/src/config/env.ts` - Already had OPENAI_API_KEY support

### Frontend (11 files)
- `constants/pdfParserApi.ts` - Updated JobStatus interface
- `app/index.tsx` - Captures and stores normalized plan
- `components/screens/PlanViewerScreen.tsx` - Added Journey tab and normalized plan support
- `components/journey/JourneyView.tsx` (NEW) - Main journey view
- `components/journey/WorkoutSectionCard.tsx` (NEW)
- `components/journey/TrackableExerciseCard.tsx` (NEW)
- `components/journey/CardioSectionCard.tsx` (NEW)
- `components/journey/NutritionSectionCard.tsx` (NEW)
- `components/journey/RehabSectionCard.tsx` (NEW)
- `components/journey/WarmupSectionCard.tsx` (NEW)
- `components/journey/EducationSectionCard.tsx` (NEW)
- `components/journey/AdminSectionCard.tsx` (NEW)

## Main Functions

### Backend
1. **`normalizeParsedPlan(rawPlan, sourceFilename)`**
   - Location: `backend/src/services/normalizePlan.service.ts`
   - Converts UniversalFitnessPlan → ProgramForTracking using OpenAI
   - Returns normalized plan or throws error

2. **`jobDb.setNormalized(id, normalizedJson)`**
   - Location: `backend/src/db/job-schema.ts`
   - Stores normalized plan in database

### Frontend
1. **`JourneyView` component**
   - Location: `components/journey/JourneyView.tsx`
   - Renders daily schedule with trackable tasks

2. **`TrackableExerciseCard` component**
   - Location: `components/journey/TrackableExerciseCard.tsx`
   - Renders exercise with tracking inputs based on trackingTemplate

## OpenAI Normalization Prompt Example

```typescript
const systemPrompt = `You are an expert fitness program analyzer. Your job is to convert a UniversalFitnessPlan JSON into a ProgramForTracking JSON.

CRITICAL RULES:
1. You receive a UniversalFitnessPlan JSON and must output a ProgramForTracking JSON that follows the TypeScript schema exactly.
2. Your job is to REORGANIZE and NORMALIZE the content into the ProgramForTracking schema.
3. You may move items from weird places to logical places (e.g., warmup described at end of PDF should become WarmupSection before workouts).
4. You MUST NOT discard any structured content; anything that doesn't fit goes into a logical section or an admin/education bucket.
5. Group workouts by day using weekly_schedule or day_label fields. If no day structure exists, create logical day groupings.
6. Extract tracking templates intelligently: if an exercise has sets/reps, enable trackSets/trackReps; if it has weight mentioned, enable trackWeightKg.
7. For cardio, extract duration, intensity, heart rate, and weekly progression if available.
8. For nutrition, organize meals by meal_number and create options/items structure.
9. For rehab, group by target_area and create TrackableExercise entries.
10. Preserve source references (page numbers, section hints) when possible.
11. Output ONLY valid JSON that matches the ProgramForTracking TypeScript interface. No markdown, no explanations.

ProgramForTracking Schema:
{
  meta: { title: string, subtitle?: string, author?: string, sourcePdfName?: string },
  profile: { traineeName: string, age?: string, gender?: string, heightCm?: string, weightKg?: string, location?: string, goals: string[], keyInjuries: string[], keyNotes: string[] },
  schedule: { logicalDays: ProgramDay[] },
  nutritionOverview?: { totalCalories?: number, macros?: { carbsG?: number, proteinG?: number, fatG?: number } },
  education?: EducationItem[],
  debugRef?: { sourcePlanType: "UniversalFitnessPlan", rawPlanId?: string }
}

ProgramDay: { id: string, label: string, tags: string[], sections: DaySection[] }
DaySection: WorkoutSection | CardioSection | NutritionSection | RehabSection | WarmupSection | EducationSection | AdminSection
WorkoutSection: { id: string, type: "workout", title: string, notes?: string, muscleGroups: string[], exercises: TrackableExercise[] }
TrackableExercise: { id: string, name: string, sets: number | null, reps: string | null, tempo?: string | null, restSeconds?: number | null, equipment?: string | null, muscles?: string[], mediaLinks?: string[], sourceRefs?: SourceRef[], trackingTemplate: { trackWeightKg?: boolean, trackReps?: boolean, trackSets?: boolean, trackTempo?: boolean, trackRpe?: boolean, trackCompletedCheckbox?: boolean } }
... (full schema details in prompt)`;

const userPrompt = `Convert this UniversalFitnessPlan JSON into a ProgramForTracking JSON:

${JSON.stringify(rawPlan, null, 2)}

${sourceFilename ? `Source PDF filename: ${sourceFilename}` : ''}

Output ONLY the ProgramForTracking JSON object, no other text.`;
```

**Model used**: `gpt-4o-mini` (cheaper model for JSON-to-JSON transformation)
**Temperature**: `0.3` (lower for more deterministic output)
**Response format**: `json_object` (structured output mode)

## Before → After Examples

### Before (Raw Plan)
```json
{
  "workouts": [
    { "name": "Push Day", "day_label": "Monday", "exercises": [...] }
  ],
  "warmup_protocols": [...],
  "nutrition_plan": [...]
}
```
UI had to manually group by day, extract tracking fields, etc.

### After (Normalized Plan)
```json
{
  "schedule": {
    "logicalDays": [
      {
        "id": "day-1",
        "label": "Day 1 – Chest/Triceps",
        "tags": ["chest", "triceps", "strength"],
        "sections": [
          {
            "type": "warmup",
            "title": "Warm-up",
            "exercises": [...]
          },
          {
            "type": "workout",
            "title": "Push Day",
            "muscleGroups": ["Chest", "Triceps"],
            "exercises": [
              {
                "id": "ex-1",
                "name": "Bench Press",
                "sets": 3,
                "reps": "8-12",
                "trackingTemplate": {
                  "trackWeightKg": true,
                  "trackReps": true,
                  "trackSets": true,
                  "trackCompletedCheckbox": true
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```
UI simply loops over days → sections → exercises, renders tracking inputs based on template.

## Validation

✅ Types shared between backend and frontend
✅ Second stage normalization in backend
✅ No UI logic-brain (just loops over structure)
✅ User sees journey view with trackable tasks
✅ No regressions (legacy view still works)

