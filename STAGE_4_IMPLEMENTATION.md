# Stage 4: Task Detail Screens & Detailed Tracking - Implementation Summary

## Overview
Implemented Stage 4: Task Detail Screens & Detailed Tracking that allows users to view detailed task information and track specific metrics (weight, reps, sets, RPE, duration, distance, etc.) based on the `trackingTemplate` flags in `ProgramForTracking`.

## Files Created

### Task Detail Screen
- **`components/screens/TaskDetailScreen.tsx`** (NEW)
  - Comprehensive detail view for any journey task
  - Shows task-specific content (exercises, meals, cardio sessions, etc.)
  - Dynamic tracking inputs based on `trackingTemplate` flags
  - Completion toggle
  - Media link support

## Files Updated

- **`components/screens/JourneyScreen.tsx`**
  - Added `selectedTask` state
  - Wired task card `onPress` to navigate to detail screen
  - Conditional rendering: shows `TaskDetailScreen` when task is selected

## Key Features

### 1. Workout Task Detail
- Lists all exercises from the workout section
- Shows exercise details: sets, reps, tempo, rest, equipment
- Tracking inputs (when enabled in `trackingTemplate`):
  - **Weight (kg)**: `trackWeightKg`
  - **Reps Completed**: `trackReps`
  - **Sets Completed**: `trackSets`
  - **RPE (1-10)**: `trackRpe`
- Media link support (videos/images)
- Real-time data persistence

### 2. Cardio Task Detail
- Shows session details: duration, intensity, heart rate range
- Tracking inputs (when enabled):
  - **Duration (minutes)**: `trackDuration`
  - **Distance (km)**: `trackDistance`
  - **RPE (1-10)**: `trackRpe`
- Weekly progression notes display

### 3. Nutrition Task Detail
- Lists all meals for the day
- Shows meal options and items with amounts
- Tracking inputs (when enabled):
  - **Portion Multiplier**: `trackPortionMultiplier` (0.5x, 1x, 1.5x, etc.)
- Meal-by-meal breakdown

### 4. Rehab/Warmup/Stretching Task Detail
- Lists all exercises from the section
- Shows sets × reps if available
- Media link support for exercise videos
- Simple exercise list view

### 5. Education Task Detail
- Shows education item title and text
- Source references if available
- Simple text display

## Data Flow

1. **User clicks task card** → `JourneyScreen` sets `selectedTask` state
2. **TaskDetailScreen renders** → Loads progress from AsyncStorage
3. **User enters tracking data** → `updateTaskTrackedData()` called
4. **Data persists** → Saved to `journeyProgress:<programId>` in AsyncStorage
5. **User toggles completion** → `toggleTaskCompletion()` updates completion state
6. **User navigates back** → `selectedTask` cleared, returns to journey view

## Tracking Template Integration

The detail screen respects the `trackingTemplate` flags from `ProgramForTracking`:

```typescript
// Workout exercises
trackingTemplate: {
  trackWeightKg?: boolean;
  trackReps?: boolean;
  trackSets?: boolean;
  trackTempo?: boolean;
  trackRpe?: boolean;
}

// Cardio sessions
trackingTemplate: {
  trackDuration?: boolean;
  trackDistance?: boolean;
  trackRpe?: boolean;
}

// Nutrition meals
trackingTemplate: {
  trackPortionMultiplier?: boolean;
}
```

Only enabled tracking fields show input controls in the detail screen.

## Progress Storage

All tracked data is stored in `JourneyTaskProgress`:

```typescript
{
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
```

Storage key: `journeyProgress:<programId>`

## UI Structure

### TaskDetailScreen Layout
```
Header (Back button + Task title + Description)
Completion Toggle Card (Checkbox + "Mark as completed")
Task-Specific Detail Section:
  - Workout: Exercise list with tracking inputs
  - Cardio: Session details + tracking inputs
  - Nutrition: Meal list + portion tracking
  - Rehab/Warmup: Exercise list
  - Education: Text content
```

## Testing Instructions

1. **Open Journey tab** → Select a program
2. **Click on a workout task** → Should see exercise list
3. **Enter weight/reps/sets** → Data should save automatically
4. **Toggle completion** → Checkbox should update
5. **Navigate back** → Should return to journey view
6. **Re-open same task** → Tracked data should persist
7. **Test cardio task** → Enter duration/distance
8. **Test nutrition task** → Enter portion multiplier
9. **Test rehab/warmup task** → View exercise list

## Acceptance Criteria Status

✅ **Task Detail Screens**: Comprehensive detail views for all task types
✅ **Dynamic Tracking Inputs**: Inputs appear based on `trackingTemplate` flags
✅ **Data Persistence**: All tracked data saves to AsyncStorage
✅ **Completion Toggle**: Works in detail screen
✅ **Navigation**: Smooth navigation between journey and detail views
✅ **Media Links**: Support for exercise videos/images (UI ready, link opening TODO)
✅ **No Regressions**: Journey screen and progress tracking still work

## File Locations Summary

- **Task Detail Screen**: `components/screens/TaskDetailScreen.tsx`
- **Journey Screen**: `components/screens/JourneyScreen.tsx` (updated)
- **Progress Storage**: `app/lib/journeyProgress.ts` (already supports tracked data)

## How to Test

1. Open Journey → Click any task card
2. View task details → Enter tracking data
3. Toggle completion → Navigate back
4. Re-open task → Verify data persisted

## Next Steps (Future Enhancements)

- [ ] Open media links in video player or browser
- [ ] Exercise history tracking (previous sessions)
- [ ] Progress charts/visualizations
- [ ] Export tracked data
- [ ] Set reminders/notifications for tasks
- [ ] Calendar integration for date mapping


