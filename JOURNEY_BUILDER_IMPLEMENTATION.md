# Journey Builder & Daily Task Engine - Implementation Summary

## Overview
Implemented Stage 3: Journey Builder & Daily Task Engine that converts `ProgramForTracking` into a daily journey with trackable tasks, persistent progress, and a "Today" view.

## Files Created

### Types
- **`app/types/journey.ts`** (NEW)
  - `JourneyTimeline` - Full program timeline with days and tasks
  - `JourneyDay` - Single day with tasks
  - `JourneyTask` - Individual trackable task
  - `JourneyTaskCategory` - Task types (workout, cardio, rehab, etc.)
  - `JourneyTaskTimeOfDay` - Time slots (morning, midday, evening, anytime)
  - `JourneyProgress` - Progress tracking map

### Journey Builder
- **`app/lib/buildJourneyTimeline.ts`** (NEW)
  - `buildJourneyTimeline()` - Pure function mapping ProgramForTracking → JourneyTimeline
  - Handles weekly pattern repetition
  - Builds tasks from sections (workout, cardio, rehab, warmup, nutrition, education)
  - Adds rest day tasks
  - Deterministic ID generation

### Storage Helpers
- **`app/lib/journeyProgress.ts`** (NEW)
  - `getJourneyProgress()` - Load progress for a program
  - `toggleTaskCompletion()` - Toggle task completion
  - `isTaskCompleted()` - Check completion status
  - `updateTaskTrackedData()` - Update tracked metrics
  - `clearJourneyProgress()` - Clear all progress

- **`app/lib/journeyStorage.ts`** (NEW)
  - `saveJourneyTimeline()` - Save timeline to AsyncStorage
  - `loadJourneyTimeline()` - Load timeline from AsyncStorage
  - `clearJourneyTimeline()` - Clear timeline

### UI Components
- **`components/screens/JourneyScreen.tsx`** (NEW)
  - Main journey screen with "Today" view
  - Day navigation
  - Progress summary
  - Tasks grouped by time of day
  - Handles timeline building and progress loading

- **`components/journey/JourneyTaskCard.tsx`** (NEW)
  - Renders individual task card
  - Checkbox for completion
  - Category tags
  - Meta information display
  - Clickable for detail view

### Navigation Updates
- **`components/ui/BottomNavigation.tsx`**
  - Added "Journey" tab with Calendar icon
  - Updated Tab type to include 'journey'

- **`app/index.tsx`**
  - Added `activeNormalizedPlan` and `activeProgramId` state
  - Added journey screen routing
  - Handles normalized plan selection
  - Stores normalized plan in AsyncStorage

## Key Functions

### `buildJourneyTimeline(program, programId, options?)`
**Location**: `app/lib/buildJourneyTimeline.ts`

**Purpose**: Pure function that converts `ProgramForTracking` → `JourneyTimeline`

**Logic**:
1. Extracts base weekly pattern from `program.schedule.logicalDays`
2. Repeats pattern for `totalWeeks` (default 4)
3. For each day:
   - Maps sections to tasks (workout, cardio, rehab, warmup, nutrition, education)
   - Adds rest day tasks (stretching, nutrition) for non-workout days
   - Calculates date from start date
   - Generates deterministic task IDs

**Task Building Rules**:
- **Workout**: One task per workout section, includes muscle groups
- **Cardio**: One task per cardio session
- **Rehab**: One task per rehab section (target area)
- **Warmup**: One task per warmup section
- **Nutrition**: One task per day (meal plan adherence)
- **Education**: Distributed across first week (one per day)

### `toggleTaskCompletion(programId, taskId)`
**Location**: `app/lib/journeyProgress.ts`

**Purpose**: Toggle task completion and persist to AsyncStorage

**Storage Key**: `journeyProgress:<programId>`

## Data Flow

1. **User uploads PDF** → Backend normalizes → Returns `normalizedPlan` in job status
2. **Frontend receives** → Stores in AsyncStorage with document
3. **User opens Journey tab** → `JourneyScreen` loads:
   - Checks for saved timeline in AsyncStorage
   - If missing, calls `buildJourneyTimeline()` to create it
   - Saves timeline for future use
4. **User views today** → Screen calculates today's day index from start date
5. **User toggles task** → `toggleTaskCompletion()` updates progress → Persists to AsyncStorage
6. **App reload** → Progress loads from AsyncStorage → Tasks show correct completion state

## UI Structure

### JourneyScreen Layout
```
Header (Program title + Day label)
Progress Summary Card (X of Y tasks completed)
Day Navigation (Previous/Next + Day selector)
Tasks by Time of Day:
  - Morning (warmup, rehab)
  - Midday (workout)
  - Evening (cardio, stretching)
  - Anytime (nutrition, education)
```

### JourneyTaskCard
- Checkbox (left)
- Title + Description + Meta (center)
- Category tag + Time of day (bottom)
- Clickable for detail view (future)

## Testing Instructions

1. **Upload a PDF** → Wait for parsing and normalization
2. **Select the document** from Domains
3. **Open Journey tab** → Should see Day 1 tasks
4. **Mark 2-3 tasks as complete** → Checkboxes should toggle
5. **Reload app** (stop Metro, restart) → Tasks should still show as completed
6. **Navigate to Day 2** → Should see different tasks
7. **Check progress summary** → Should update with completion percentage

## Acceptance Criteria Status

✅ **JourneyTimeline builder**: Pure function converts ProgramForTracking → JourneyTimeline for 4+ weeks
✅ **Persistent progress**: Completion state survives app reload
✅ **Today view**: Shows Day 1 with workout, cardio, stretching, nutrition tasks
✅ **No crashes with partial data**: Handles missing fields gracefully
✅ **No backend regressions**: Upload/parsing still works, PlanViewerScreen still works

## File Locations Summary

- **Journey Types**: `app/types/journey.ts`
- **Journey Builder**: `app/lib/buildJourneyTimeline.ts`
- **Progress Storage**: `app/lib/journeyProgress.ts`
- **Timeline Storage**: `app/lib/journeyStorage.ts`
- **Journey Screen**: `components/screens/JourneyScreen.tsx`
- **Task Card**: `components/journey/JourneyTaskCard.tsx`
- **Navigation**: `components/ui/BottomNavigation.tsx` (updated)
- **App State**: `app/index.tsx` (updated)

## How to Test

1. Upload plan → Select domain → Open Journey tab
2. See Day 1 tasks and mark them complete
3. Reload app → Verify tasks remain completed
4. Navigate between days → See different tasks per day

