# Tracking Layer Implementation Summary

## Overview
Added a normalized tracking layer on top of the existing `UniversalFitnessPlan` JSON to provide a calendar-ready, tracking-first program representation for the client app.

## Architecture

### Stage 1 (Existing)
- **PDF → UniversalFitnessPlan** (raw parsed JSON via Cloudflare Worker)

### Stage 2 (New)
- **UniversalFitnessPlan → ProgramForTracking** (normalized, calendar-ready via OpenAI normalization)

## Files Changed

### 1. Shared Schema
- **`shared/programTrackingSchema.ts`** (NEW)
  - Defines `ProgramForTracking` interface and all related types
  - Used by both backend (normalization) and frontend (UI)
  - Calendar-ready structure with logical days, trackable exercises, meals, etc.

### 2. Backend Changes

#### Normalization Service
- **`backend/src/services/normalizePlan.service.ts`** (NEW)
  - `normalizeParsedPlan()` function
  - Uses OpenAI `gpt-4o-mini` for JSON-to-JSON transformation
  - Converts `UniversalFitnessPlan` → `ProgramForTracking`
  - Handles errors gracefully (doesn't fail job if normalization fails)

#### Database Schema
- **`backend/src/db/job-schema.ts`**
  - Added `normalizedJson` field to `ParseJob` interface
  - Added migration for `normalizedJson` column
  - Added `setNormalized()` method to store normalized plan

#### Job Processing
- **`backend/src/services/parseJob.service.ts`**
  - Added normalization step after merge completes
  - Calls `normalizeParsedPlan()` after saving raw result
  - Normalization errors are logged but don't fail the job

#### API Controller
- **`backend/src/controllers/parse.controller.ts`**
  - Updated `getJobStatus()` to return `normalizedPlan` in response
  - Both `result` (raw) and `normalizedPlan` are included when available

### 3. Frontend Changes

#### API Types
- **`constants/pdfParserApi.ts`**
  - Updated `JobStatus` interface to include `normalizedPlan?: any`

#### Journey View Components
- **`components/journey/JourneyView.tsx`** (NEW)
  - Main journey view with day selector
  - Renders daily schedule with trackable sections

- **`components/journey/WorkoutSectionCard.tsx`** (NEW)
  - Renders workout sections with trackable exercises

- **`components/journey/TrackableExerciseCard.tsx`** (NEW)
  - Renders individual exercises with tracking inputs
  - Supports weight, reps, sets, RPE, completion checkbox based on `trackingTemplate`

- **`components/journey/CardioSectionCard.tsx`** (NEW)
  - Renders cardio sessions with tracking inputs

- **`components/journey/NutritionSectionCard.tsx`** (NEW)
  - Renders meals with portion tracking

- **`components/journey/RehabSectionCard.tsx`** (NEW)
- **`components/journey/WarmupSectionCard.tsx`** (NEW)
- **`components/journey/EducationSectionCard.tsx`** (NEW)
- **`components/journey/AdminSectionCard.tsx`** (NEW)

#### Plan Viewer Screen
- **`components/screens/PlanViewerScreen.tsx`**
  - Updated to accept `normalizedPlan` prop
  - Added "Journey" tab (shown first if normalized plan exists)
  - Falls back to legacy sections if no normalized plan
  - Journey view uses `JourneyView` component

#### App State Management
- **`app/index.tsx`**
  - Captures `normalizedPlan` from job status updates
  - Stores normalized plan in AsyncStorage alongside raw plan
  - Passes normalized plan to `PlanViewerScreen` when available

## Key Functions

### Backend

1. **`normalizeParsedPlan(rawPlan, sourceFilename)`**
   - Location: `backend/src/services/normalizePlan.service.ts`
   - Input: `UniversalFitnessPlan` JSON
   - Output: `ProgramForTracking` JSON
   - Uses OpenAI with structured prompt to reorganize content

2. **`jobDb.setNormalized(id, normalizedJson)`**
   - Location: `backend/src/db/job-schema.ts`
   - Stores normalized plan in database

### Frontend

1. **`JourneyView` component**
   - Location: `components/journey/JourneyView.tsx`
   - Renders daily schedule with trackable tasks
   - Day selector for navigating between days
   - Section-based rendering (workout, cardio, nutrition, etc.)

2. **`TrackableExerciseCard` component**
   - Location: `components/journey/TrackableExerciseCard.tsx`
   - Renders exercise with tracking inputs based on `trackingTemplate`
   - Supports: weight, reps, sets, tempo, RPE, completion checkbox

## OpenAI Normalization Prompt

The normalization uses a structured system prompt that:

1. **Instructs the model** to convert `UniversalFitnessPlan` → `ProgramForTracking`
2. **Reorganizes content** logically (e.g., warmup before workouts)
3. **Preserves all data** (nothing discarded, moved to admin/education if needed)
4. **Groups by day** using `weekly_schedule` or `day_label`
5. **Extracts tracking templates** intelligently based on available fields
6. **Outputs strict JSON** matching the TypeScript schema

**Example prompt structure:**
```
You are an expert fitness program analyzer. Your job is to convert a UniversalFitnessPlan JSON into a ProgramForTracking JSON.

CRITICAL RULES:
1. You receive a UniversalFitnessPlan JSON and must output a ProgramForTracking JSON that follows the TypeScript schema exactly.
2. Your job is to REORGANIZE and NORMALIZE the content into the ProgramForTracking schema.
3. You may move items from weird places to logical places (e.g., warmup described at end of PDF should become WarmupSection before workouts).
4. You MUST NOT discard any structured content; anything that doesn't fit goes into a logical section or an admin/education bucket.
5. Group workouts by day using weekly_schedule or day_label fields. If no day structure exists, create logical day groupings.
6. Extract tracking templates intelligently: if an exercise has sets/reps, enable trackSets/trackReps; if it has weight mentioned, enable trackWeightKg.
...
```

## Data Flow

1. **Upload PDF** → Backend creates job, uploads to R2
2. **Parse PDF** → Worker processes chunks, merges into `UniversalFitnessPlan`
3. **Normalize Plan** → Backend calls OpenAI to convert to `ProgramForTracking`
4. **Store Both** → Backend stores both raw and normalized plans
5. **Return to Client** → API returns both plans in job status
6. **Display Journey** → Frontend shows journey view with trackable tasks

## User Experience

After uploading and parsing:
- User sees **"Journey" tab** (if normalized plan available)
- Journey view shows:
  - Day selector (Day 1, Day 2, etc.)
  - Each day's sections (Warmup, Workout, Cardio, Nutrition, etc.)
  - Trackable exercises with inputs (weight, reps, sets, checkboxes)
  - Trackable meals with portion multipliers
  - Trackable cardio with duration/distance/RPE

## Error Handling

- **Normalization failure**: Job still succeeds with raw plan, normalized plan is optional
- **Missing normalized plan**: UI falls back to legacy section view
- **Invalid normalized plan**: UI validates and shows error message

## No Regressions

- ✅ Existing logs screen works
- ✅ Troubleshooting tools work
- ✅ Legacy view remains available as fallback
- ✅ All existing functionality preserved

## Next Steps (Future Enhancements)

1. **Calendar Integration**: Map logical days to real dates
2. **Progress Tracking**: Persist tracking data (weights, reps, completion)
3. **Analytics**: Show progress over time
4. **Notifications**: Remind users of daily tasks
5. **Sharing**: Export tracking data

