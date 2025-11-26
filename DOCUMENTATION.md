# AI Fitness PDF Parser - Project Documentation

**Last Updated:** 26 Nov 2025
**Version:** 1.3.0 (Coach-Ready Beta)

## 1. Project Overview

The **AI Fitness PDF Parser** is a mobile-first application designed to parse unstructured fitness PDF documents (workout plans, nutrition guides) into structured, interactive data. It uses a **Cloudflare Worker** wrapping OpenAI's GPT-4o to extract data page-by-page, which is then aggregated by a **Node.js backend** and displayed in a **React Native (Expo)** app.

## 2. Architecture

### 2.1 Frontend (Expo / React Native)
- **Main Navigation Tabs:**
  - **Home:** PDF upload, live system logs, status feedback.
  - **Documents:** List of parsed documents with normalized plans.
  - **Journey:** Daily task tracking with day-by-day view, task completion, and detailed task views.
  - **Progress:** Adherence metrics, completion rates, streaks, calendar view, and category breakdowns.
  - **Logs (Troubleshooting):** Backend logs viewer with Mapping Debug access.
- **Secondary Screens:**
  - **Plan Viewer:** Detailed view of parsed plan (Profile, Workouts, Nutrition, Debug sections).
  - **Task Detail:** Individual task tracking with weight/reps/duration inputs based on tracking templates.
  - **Mapping Debug:** 4-layer pipeline inspection (Worker JSON → Buckets → Journey Timeline → Progress Storage).
  - **Help & How-To:** In-app onboarding and troubleshooting guide for coaches.
- **Tech Stack:** React Native, Expo, Lucide Icons, AsyncStorage.
- **Design:** "Dark Premium" UI with glassmorphism and vibrant accents.
- **Data Persistence:** All journey and progress data stored in AsyncStorage with scoped keys.

### 2.2 Backend (Node.js / Express)
- **Endpoints:**
  - `POST /api/parse`: Uploads PDF, splits into pages, sends to worker, merges results, saves to DB.
  - `GET /api/plans/:id`: Fetches full parsed plan.
- **Services:**
  - `PdfService`: Splits PDF into pages (text + image placeholder).
  - `WorkerService`: Sends pages to Cloudflare Worker.
  - `MergeService`: Aggregates page-level JSON into a unified `UniversalFitnessPlan`.
- **Database:** SQLite (`ParsedPlan` table).

### 2.3 Cloudflare Worker (Universal Parser v3.0)
- **URL:** `https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/`
- **Model:** `gpt-4.1-mini`
- **Input:** `{ page_number, image_base64, text }`
- **Output:** Single JSON object following the **Universal Fitness Schema**.
- **Contract:** Does NOT return `domains[]`. Returns root-level keys: `meta`, `profile`, `workouts`, `nutrition_plan`, `debug`, etc.

## 3. Universal Fitness Schema (v3.0)

The backend and frontend are aligned to this schema:

```json
{
  "meta": { "title": "...", "coach_name": "..." },
  "profile": { "trainee_name": "...", "age": "...", "goals": [] },
  "workouts": [
    {
      "name": "Push Day",
      "exercises": [
        { "name": "Bench Press", "sets": 3, "reps": "10", "notes": "..." }
      ]
    }
  ],
  "nutrition_plan": [
    { "name": "Breakfast", "items": [] }
  ],
  "cardio_sessions": [],
  "supplements": [],
  "mobility_and_rehab": [],
  "stretching_routines": [],
  "debug": {
    "pages": [
      { "page_number": 1, "raw_text": "...", "notes": "..." }
    ]
  }
}
```

## 4. Data Flow

### 4.1 Parsing Pipeline
1.  **Upload:** User selects PDF -> App sends to `POST /api/parse`.
2.  **R2 Storage:** Backend uploads PDF to Cloudflare R2, creates async job, returns `202 { jobId }`.
3.  **Background Processing:** Backend processes PDF asynchronously:
    - **Split:** `PdfService` splits PDF into N pages.
    - **Parse:** `WorkerService` sends each page to Cloudflare Worker.
    - **Merge:** `MergeService` aggregates N page JSONs into one `UniversalFitnessPlan`.
    - **Normalize:** `normalizePlan.service` converts `UniversalFitnessPlan` to `ProgramForTracking`.
4.  **Save:** Backend saves both raw plan and normalized plan to SQLite.
5.  **Polling:** Frontend polls `/api/parse/:jobId/status` until completion.
6.  **Storage:** Frontend saves parsed plan + normalized plan to AsyncStorage with key `parsed_doc_<jobId>`.

### 4.2 Journey & Progress Pipeline
1.  **Journey Generation:** When a normalized plan is loaded, `buildJourneyTimeline()` creates a `JourneyTimeline`:
    - Maps `ProgramForTracking` to daily tasks.
    - Repeats weekly schedule for default 4 weeks.
    - Generates deterministic task IDs.
2.  **Storage:** Journey timeline saved to AsyncStorage with key `journey:<programId>`.
3.  **Progress Tracking:** Task completions stored in AsyncStorage with key `journeyProgress:<programId>`.
4.  **Adherence Calculation:** `calcAdherenceSummary()` computes metrics from timeline + progress (pure function, no storage).
5.  **Display:** Journey and Progress screens read from AsyncStorage and display real-time data.

## 5. Key Features

### 5.1 Core Parsing & Display
-   **Live Debugging:** "System Logs" on Home screen show real-time backend progress.
-   **Resilient Parsing:** "Unclassified" content is preserved; partial failures don't crash the app.
-   **Universal Support:** Handles various fitness plan formats via the generic schema.
-   **Local Storage:** Parsed plans are cached locally on the device.

### 5.2 Journey & Tracking System (Stages 3-4)
-   **Journey Timeline:** Automatic conversion of normalized plans into daily task schedules.
-   **Task Tracking:** Mark tasks as completed, track weight/reps/duration based on tracking templates.
-   **Day Navigation:** Browse through program days with task grouping by time of day (Morning, Midday, Evening, Anytime).
-   **Task Details:** Detailed views for workouts, cardio, nutrition, rehab, and education tasks.

### 5.3 Progress & Adherence Intelligence (Stage 5)
-   **Overall Metrics:** Completion rates for entire program, last 7 days, and last 30 days.
-   **Streak Tracking:** Current and best streaks based on completion thresholds.
-   **Calendar View:** Monthly calendar with color-coded adherence levels (none, low, medium, high).
-   **Category Breakdown:** Per-category completion stats (workout, cardio, nutrition, rehab, etc.).
-   **Red Flags:** Automatic detection of days with poor adherence (< 40% completion).

### 5.4 Mapping Debug & Acceptance (Stage 6)
-   **4-Layer Inspection:** Visual inspection of Worker JSON → Universal Buckets → Journey Timeline → Progress Storage.
-   **Consistency Checks:** Automatic detection of mismatches between timeline and progress data.
-   **Bucket Analysis:** View content distribution across universal buckets with page mapping.
-   **Raw Data Access:** Collapsible JSON viewers for debugging and verification.

### 5.5 Coach-Ready Tools (Stage 7)
-   **Data Reset Tools:**
    - Reset Current Program Progress (clears only task completions for active program).
    - Reset All Local App Data (complete app reset, returns to fresh state).
-   **In-App Help:** Step-by-step workflow guide and troubleshooting tips accessible from Documents tab.
-   **Improved UX:**
    - Clear empty states across all screens.
    - Human-readable error messages with actionable guidance.
    - Consistent navigation and back button behavior.

## 6. Setup & Commands

-   **Backend:** `cd backend && npm run dev` (Port 4000)
-   **Frontend:** `npx expo start` (Metro Bundler)
-   **Env:** `EXPO_PUBLIC_BACKEND_API_URL` must point to backend IP.

## 7. User Guide (For Coaches)

### 7.1 Basic Workflow
1. **Upload PDF:** Go to Home tab, tap "Pick Document", select your fitness plan PDF, then tap "Upload & Parse".
2. **Wait for Parsing:** Monitor progress in the Logs tab. Large PDFs (50+ pages) may take 10-30 minutes.
3. **View Journey:** Once parsing completes, go to Journey tab to see daily tasks organized by day.
4. **Track Progress:** Mark tasks as completed, add tracking data (weight, reps, duration) by tapping on tasks.
5. **Monitor Adherence:** Check Progress tab for completion rates, streaks, and calendar view.

### 7.2 Troubleshooting
- **Parsing taking too long:** Large PDFs require time. Check Logs tab for real-time progress. Do not close the app during processing.
- **Tasks missing or incorrect:** Go to Logs → Mapping Debug to inspect what was parsed from the PDF.
- **Progress data seems wrong:** Use "Reset Current Program Progress" in Mapping Debug to clear task completions.
- **Everything broken:** Use "Reset All Local App Data" in Mapping Debug to return to a fresh state (requires re-uploading PDF).

### 7.3 Important Limitations
- The app currently handles **one program at a time**. Uploading a new PDF replaces the current program.
- **Do not close the app** during PDF parsing. The process runs in the background but requires the app to stay open.
- Parsing quality depends on PDF structure. Well-formatted fitness plans work best.

## 8. Technical Troubleshooting

-   **"Cannot read property 'workouts' of undefined":** Backend failed to return a valid `fitnessPlan` DTO. Check `parse.controller.ts`.
-   **"Worker returned invalid JSON":** Worker failed or returned non-JSON. Check "System Logs" or Mapping Debug.
-   **"Network Error":** Ensure phone/emulator is on same network as backend and IP is correct. Check error message for specific guidance.
-   **"No Journey Available":** Ensure a normalized plan exists. Check Documents tab to select a program with a normalized plan.
-   **Progress not saving:** Check AsyncStorage keys using Mapping Debug. Verify `journeyProgress:<programId>` exists.

## 9. Development Log & Implementation History

### 9.1 Stage 7 - Coach-Ready Finish (Nov 26, 2025)
- **Navigation Cleanup:** Removed Settings tab, cleaned up bottom navigation to show only essential tabs.
- **Data Reset Tools:** Added reset current program progress and reset all local data with clear confirmations.
- **Help & Onboarding:** Created in-app help screen with step-by-step workflow guide and troubleshooting tips.
- **UX Improvements:** Enhanced empty states, human-readable error messages, consistent navigation behavior.
- **Legacy Cleanup:** Removed FitnessPlanScreen (replaced by PlanViewerScreen).

### 9.2 Stage 6 - Mapping Acceptance & Debug Layer (Nov 26, 2025)
- **Mapping Debug Screen:** 4-layer pipeline inspection (Worker JSON, Universal Buckets, Journey Timeline, Progress Storage).
- **Consistency Checks:** Automatic detection of mismatches between timeline and progress data.
- **Bucket Analysis:** Visual inspection of content distribution across universal buckets.
- **Access:** Mapping Debug accessible only from Troubleshooting tab.

### 9.3 Stage 5 - Progress & Adherence Intelligence (Nov 26, 2025)
- **Progress Screen:** Overall completion rates, last 7/30 days metrics, streak tracking.
- **Adherence Calendar:** Monthly calendar with color-coded adherence levels.
- **Category Breakdown:** Per-category completion statistics with progress bars.
- **Pure Calculation:** `calcAdherenceSummary()` computes all metrics from timeline + progress (no side effects).

### 9.4 Stage 4 - Task Detail & Tracking (Nov 2025)
- **Task Detail Screen:** Detailed views for workouts, cardio, nutrition, rehab, and education tasks.
- **Tracking Inputs:** Dynamic inputs based on `trackingTemplate` flags (weight, reps, sets, duration, distance, etc.).
- **Progress Persistence:** Task completions and tracked data saved to AsyncStorage.

### 9.5 Stage 3 - Journey Builder & Daily Task Engine (Nov 2025)
- **Journey Timeline:** Automatic conversion of `ProgramForTracking` to `JourneyTimeline` with daily tasks.
- **Journey Screen:** Day-by-day view with task grouping by time of day.
- **Task Cards:** Interactive task cards with completion checkboxes.
- **Storage:** Journey timeline and progress stored in AsyncStorage.

### 9.6 Previous Development Log (Nov 20, 2025)

#### 9.6.1 Errors Faced & Resolutions

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| **Empty Fitness Plan Data** | Backend `merge.service.ts` was using old domain-based logic and ignoring Worker v3.0 schema. | **Rewrote `merge.service.ts`** to initialize a full `UniversalFitnessPlan` structure and merge page results by pushing to arrays (`workouts`, `nutrition_plan`, etc.) and shallow-merging objects. |
| **Frontend Freezing** | `LogViewer` was using `ScrollView` for thousands of logs, causing performance bottlenecks. | **Refactored `LogViewer`** to use `FlatList` for efficient rendering of large log datasets. |
| **500 Internal Server Error (Upload)** | Mismatch between frontend `FormData` field name (`pdf`) and backend `multer` configuration (`file`). | **Updated `parse.routes.ts`** to expect `upload.single('pdf')` matching the frontend. |
| **"Internal Server Error" (No Logs)** | Frontend `fetch` error handling was swallowing the response body on non-200 status. | **Updated `app/index.tsx`** to parse and display `logs` from the error response body even on failure. |
| **Sequential Processing Warning** | Backend was processing pages one-by-one. | **Added Performance Instrumentation** to `parse.controller.ts` to detect and warn about sequential processing (future optimization: parallelize worker calls). |

#### 9.6.2 Key User Requests & Actions

1.  **"Fix the backend so that parsing a PDF returns a fully populated UniversalFitnessPlan"**
    *   **Action:** Updated `src/types/fitnessPlan.ts` to match Worker v3.0 schema.
    *   **Action:** Updated `src/services/worker.service.ts` to return raw `PageParseResponse`.
    *   **Action:** Reimplemented `src/services/merge.service.ts` with robust v3 merging logic.

2.  **"Log start/end timestamps per page... Detect if pages are being processed strictly sequentially"**
    *   **Action:** Added timing logs to `worker.service.ts` (start/end per page).
    *   **Action:** Added timing logs to `merge.service.ts` (merge duration).
    *   **Action:** Added global pipeline timing and sequential processing warning to `parse.controller.ts`.

3.  **"Make sure the system logs and the json are showing the logs and results"**
    *   **Action:** Modified `parse.controller.ts` to capture console logs into an array and return them in the API response.
    *   **Action:** Updated `app/index.tsx` to display these backend logs in the `LogViewer`.

#### 9.6.3 Technical Explanations

*   **Worker v3 Schema:** The Cloudflare Worker now returns a flat, universal JSON structure for every page (e.g., `{ workouts: [], nutrition_plan: [], ... }`). It no longer uses the "domain" concept. The backend must respect this and simply aggregate the arrays.
*   **Merge Logic:** Since the worker returns partial data per page, the backend must initialize a "container" plan with empty arrays for all possible sections. It then iterates through each page's result and concatenates the arrays (e.g., `plan.workouts.push(...page.workouts)`).
*   **Multer Mismatch:** `multer` is strict about field names. If the client sends `pdf` but the server expects `file`, it throws an error before the controller is reached. This is why the custom logging logic wasn't triggering for the 500 error initially.

### 9.7 Current Status (Nov 26, 2025)
*   **Backend:** Fully aligned with Universal v3.0 schema. Async job processing with R2 storage. Normalization layer integrated.
*   **Frontend:** Complete Journey and Progress system. Mapping Debug tools. Coach-ready UX with help and reset tools.
*   **Data Flow:** Worker JSON → Normalization → Journey Timeline → Progress Tracking → Adherence Metrics (fully implemented).
*   **Storage:** All data persisted in AsyncStorage with scoped keys. Reset tools available for recovery.
*   **Status:** Coach-ready MVP with full pipeline from PDF upload to progress tracking and adherence monitoring.
