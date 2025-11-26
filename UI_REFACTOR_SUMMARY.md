# UI REFACTOR SUMMARY
**Date:** 2025-11-25  
**Scope:** React Native UI refactoring for parsed fitness plan display

---

## 1. TROUBLESHOOTING SCREEN

**Status:** ✅ Already exists and integrated

**Location:** `components/screens/TroubleshootingScreen.tsx`

**Navigation:** Already accessible via bottom navigation tab "Logs"

**Features:**
- Fetches backend logs from `/api/logs` endpoint
- Auto-refresh every 3 seconds
- Shows logs with timestamp, level, source, and message
- Color-coded by log level (info, error, warn, success)
- Filtering and search capabilities

**How to Use:**
1. Navigate to "Logs" tab in bottom navigation
2. Logs automatically refresh every 3 seconds
3. View real-time backend activity during PDF upload/parsing

---

## 2. BACKEND EXECUTION TRACE

**Document Created:** `BACKEND_EXECUTION_TRACE.md`

**Contents:**
- Complete line-by-line execution path for `POST /api/parse`
- Entry point: `backend/src/server.ts:35` → `parse.routes.ts:24` → `parse.controller.ts:24`
- Response timing: Line 94 in `parse.controller.ts`
- Heavy work detection: R2 upload blocks response (line 48), all parsing happens in background
- Full log statement trace in chronological order

**Key Finding:**
- Response is sent immediately after R2 upload and job creation
- All parsing, chunking, Worker calls, and OpenAI processing happen AFTER response (non-blocking)

---

## 3. NEW UI ARCHITECTURE

### 3.1 PlanViewerScreen

**File:** `components/screens/PlanViewerScreen.tsx`

**Structure:**
- Main screen with sidebar navigation
- 9 sections: Overview, Rehab, Warmup, Stretching, Workouts, Cardio, Nutrition, Education, Debug
- Clean section-based rendering instead of dumping JSON

### 3.2 Section Components

All section components created in `components/plan/`:

1. **OverviewSection.tsx**
   - Shows: meta, profile (name, age, height, weight, location), goals, key assessment notes
   - Quick stats: workouts count, meals count, pages count

2. **RehabSection.tsx**
   - Shows: `mobility_and_rehab` grouped by `target_area`
   - Includes rehab-related workouts filtered from main workouts list

3. **WarmupSection.tsx**
   - Shows: `warmup_protocols`
   - Includes warmup-related content from `education_and_guidelines`

4. **StretchingSection.tsx**
   - Shows: `stretching_routines`
   - Displays exercises with duration and target areas

5. **WorkoutsSection.tsx**
   - Shows: `workouts` grouped by `day_label` or `weekly_schedule`
   - Renders exercises as cards with sets, reps, rest, instructions
   - Shows media links if available

6. **CardioSection.tsx**
   - Shows: `cardio_sessions`
   - Displays duration, frequency, intensity
   - Shows `weekly_progression` (week 1-4) if present

7. **NutritionSection.tsx**
   - Shows: `nutrition_plan` and `food_sources`
   - Displays daily macros (calories, protein, carbs, fats) at top
   - Meals sorted by `meal_number` with choices and ingredients
   - Food sources grouped by category

8. **EducationSection.tsx**
   - Shows: `education_and_guidelines`
   - Renders each guideline as a card

9. **DebugSection.tsx**
   - Shows: `debug.pages`
   - Displays: page_number, mapped_to keys, detected_elements, raw_text preview (first 100 chars), notes

---

## 4. DATA FLOW

### 4.1 API Call

**File:** `app/index.tsx`

**Function:** `pollJobStatus()` (line 191)

**Flow:**
1. Frontend calls `POST /api/parse` → gets `jobId`
2. Polls `GET /api/parse/:jobId/status` every 3 seconds
3. When `status === 'done'`, receives `result` (parsed JSON)
4. Sets `activePlan` state (line 228)

### 4.2 State Storage

**Location:** `app/index.tsx:28`

```typescript
const [activePlan, setActivePlan] = useState<UniversalFitnessPlan | null>(null);
```

**Also saved to:** AsyncStorage with key `${STORAGE_KEY_PREFIX}${jobId}` (line 241)

### 4.3 Navigation to PlanViewerScreen

**File:** `app/index.tsx:327-333`

```typescript
case 'fitness':
  return activePlan ? (
    <PlanViewerScreen
      plan={activePlan}
      onBack={() => setCurrentScreen('domains')}
    />
  ) : null;
```

**Trigger:** When user selects a document from DomainsScreen, `activePlan` is set and screen switches to 'fitness'

### 4.4 PlanViewerScreen → Sections

**File:** `components/screens/PlanViewerScreen.tsx:35-50`

```typescript
const renderSection = () => {
  switch (activeSection) {
    case 'overview':
      return <OverviewSection plan={plan} />;
    case 'rehab':
      return <RehabSection plan={plan} />;
    // ... etc
  }
};
```

**Data Flow:**
- `PlanViewerScreen` receives `plan: UniversalFitnessPlan`
- Each section component receives the full `plan` object
- Sections extract only the fields they need (e.g., `plan.workouts`, `plan.nutrition_plan`)

---

## 5. FILE TREE

### New Files Created:

```
components/
  screens/
    PlanViewerScreen.tsx          # New main plan viewer
  plan/
    OverviewSection.tsx           # Meta, profile, goals
    RehabSection.tsx              # Mobility & rehab
    WarmupSection.tsx             # Warmup protocols
    StretchingSection.tsx         # Stretching routines
    WorkoutsSection.tsx           # Workouts by day
    CardioSection.tsx             # Cardio sessions
    NutritionSection.tsx           # Nutrition plan & food sources
    EducationSection.tsx          # Education & guidelines
    DebugSection.tsx              # Debug pages
```

### Modified Files:

```
app/index.tsx                     # Wired PlanViewerScreen into navigation
components/screens/FitnessPlanScreen.tsx  # Marked as legacy (TODO comment)
```

### Documentation Files:

```
BACKEND_EXECUTION_TRACE.md        # Complete backend execution trace
ARCHITECTURE_AUDIT_REPORT.md      # Full system audit (from previous task)
UI_REFACTOR_SUMMARY.md            # This file
```

---

## 6. HOW TO USE

### Viewing a Parsed Plan:

1. Upload a PDF from the "Home" tab
2. Wait for parsing to complete (polling happens automatically)
3. Navigate to "Domains" tab
4. Select a parsed document
5. PlanViewerScreen opens with Overview section by default
6. Use sidebar to navigate between sections:
   - Overview: Profile and key stats
   - Rehab: Mobility and rehab routines
   - Warmup: Warmup protocols
   - Stretch: Stretching routines
   - Workouts: Workouts grouped by day
   - Cardio: Cardio sessions with progression
   - Nutrition: Meals and macros
   - Education: Guidelines and education
   - Debug: Page mapping and raw text

### Viewing Backend Logs:

1. Navigate to "Logs" tab in bottom navigation
2. Logs auto-refresh every 3 seconds
3. View real-time backend activity
4. Filter by source tags if needed

---

## 7. LEGACY CODE

**File:** `components/screens/FitnessPlanScreen.tsx`

**Status:** Marked as legacy with TODO comment

**Action:** Kept in codebase for reference, but not used in main flow

**Replacement:** `components/screens/PlanViewerScreen.tsx`

---

## 8. CONSTRAINTS FOLLOWED

✅ **Did NOT touch:**
- Cloudflare Worker
- OpenAI integration
- R2 integration
- Parsing logic or JSON schema
- Backend/Worker contracts

✅ **Only changed:**
- React Native / Expo UI
- UI mapping of parsed JSON
- Component structure

✅ **Did NOT delete:**
- Old FitnessPlanScreen (marked as legacy, kept for reference)

---

## 9. NEXT STEPS (Optional)

1. Test with real PDF uploads to verify all sections render correctly
2. Add error boundaries for missing data
3. Enhance styling for better readability
4. Add search/filter functionality within sections
5. Remove legacy FitnessPlanScreen after verification

---

**END OF SUMMARY**

