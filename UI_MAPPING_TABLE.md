# JSON → UI Mapping Table

## Complete Field Mapping for UniversalFitnessPlan

| JSON Field | Component | UI Behavior |
|------------|-----------|-------------|
| `meta.title` / `meta.plan_name` | OverviewSection | Display as plan title in hero card |
| `meta.coach_name` | OverviewSection | Display below title |
| `meta.duration_weeks` | OverviewSection | Display in stats or metadata |
| `profile.trainee_name` | OverviewSection | Display in profile grid |
| `profile.age` | OverviewSection | Display in profile grid |
| `profile.gender` | OverviewSection | Display in profile grid |
| `profile.height_cm` | OverviewSection | Display in profile grid |
| `profile.weight_kg` | OverviewSection | Display in profile grid |
| `profile.location` | OverviewSection | Display in profile grid |
| `profile.goals[]` | OverviewSection | Display as tags |
| `profile.notes[]` | OverviewSection | Display as list items |
| `assessment_and_background.health_status.injuries[]` | OverviewSection | Display in key notes section |
| `assessment_and_background.health_status.medical_conditions[]` | OverviewSection | Display in key notes section |
| `assessment_and_background.fitness_status.experience_level` | OverviewSection | Display in key notes section |
| `mobility_and_rehab[]` | RehabSection | Group by `target_area`, show name, description, exercises, video links |
| `workouts[]` (filtered for rehab) | RehabSection | Show in separate "Rehab Workouts" section |
| `warmup_protocols[]` | WarmupSection | List with name, description, exercises, video links |
| `education_and_guidelines[]` (filtered for warmup) | WarmupSection | Show in "Warmup Guidelines" section |
| `stretching_routines[]` | StretchingSection | List with name, description, exercises, frequency, video links |
| `workouts[]` | WorkoutsSection | Group by `day_label` or `weekly_schedule`, show exercises with sets/reps/rest/tempo/equipment/muscles/instructions/media_link |
| `weekly_schedule[]` | WorkoutsSection | Use to order days, display day labels |
| `cardio_sessions[]` | CardioSection | Show type, duration, frequency, intensity, heart_rate, weekly_progression (week 1-4), notes |
| `nutrition_plan[]` | NutritionSection | Sort by `meal_number`, show meal_name, calories, protein_g, carbs_g, fats_g, choices[], ingredients[], notes |
| `food_sources{}` | NutritionSection | Group by category (proteins, carbs, fats, etc.), display as lists |
| `education_and_guidelines[]` | EducationSection | Collapsible cards with title/content/text/description, handle both string and object formats |
| `debug.pages[]` | DebugSection | Virtualized/paginated list showing page_number, mapped_to[], detected_elements[], raw_text (first 100 chars), notes |

## Field Access Patterns

### Arrays (use getArray)
- `plan.workouts` → `getArray(plan.workouts)`
- `plan.nutrition_plan` → `getArray(plan.nutrition_plan)`
- `plan.warmup_protocols` → `getArray(plan.warmup_protocols)`
- `plan.mobility_and_rehab` → `getArray(plan.mobility_and_rehab)`
- `plan.stretching_routines` → `getArray(plan.stretching_routines)`
- `plan.cardio_sessions` → `getArray(plan.cardio_sessions)`
- `plan.education_and_guidelines` → `getArray(plan.education_and_guidelines)`
- `plan.weekly_schedule` → `getArray(plan.weekly_schedule)`
- `plan.debug?.pages` → `getArray(plan.debug?.pages)`
- `profile.goals` → `getArray(profile.goals)`
- `exercise.muscles` → `getArray(exercise.muscles)`

### Objects (use getObject)
- `plan.meta` → `getObject(plan.meta)`
- `plan.profile` → `getObject(plan.profile)`
- `plan.assessment_and_background` → `getObject(plan.assessment_and_background)`
- `plan.food_sources` → `getObject(plan.food_sources)`
- `plan.debug` → `getObject(plan.debug)`

### Strings (use getString)
- `meta.title` → `getString(meta.title)`
- `meta.coach_name` → `getString(meta.coach_name)`
- `profile.trainee_name` → `getString(profile.trainee_name)`
- `workout.name` → `getString(workout.name)`
- `exercise.name` → `getString(exercise.name)`

### Numbers (use getNumber)
- `profile.age` → `getNumber(profile.age)`
- `profile.height_cm` → `getNumber(profile.height_cm)`
- `profile.weight_kg` → `getNumber(profile.weight_kg)`
- `meal.calories` → `getNumber(meal.calories)`
- `meal.protein_g` → `getNumber(meal.protein_g)`
- `exercise.sets` → `getNumber(exercise.sets)`
- `exercise.reps` → `getNumber(exercise.reps)`

## Grouping Rules

1. **Workouts**: Group by `day_label` or use `weekly_schedule` to order days
2. **Rehab**: Group by `target_area` (fallback to 'General')
3. **Nutrition**: Sort meals by `meal_number` (ascending)
4. **Cardio**: Show weekly progression as week 1, 2, 3, 4 if available
5. **Education**: No grouping, but use collapsible cards for long content

## Media Links

- If `exercise.media_link` exists → show clickable icon/button
- If `warmup_protocol.video_url` exists → show video preview or link
- If `rehab_item.video_url` exists → show video preview or link
- If `stretching_routine.video_url` exists → show video preview or link

## Empty State Handling

All sections must show a clean "No data" placeholder when:
- Array is empty or undefined
- Object has no keys
- All relevant fields are missing

