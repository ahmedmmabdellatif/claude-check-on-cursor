# AI Fitness PDF Parser - Project Documentation

**Last Updated:** 20 Nov 2025
**Version:** 1.0.0 (Beta)

## 1. Project Overview

The **AI Fitness PDF Parser** is a mobile-first application designed to parse unstructured fitness PDF documents (workout plans, nutrition guides) into structured, interactive data. It uses a **Cloudflare Worker** wrapping OpenAI's GPT-4o to extract data page-by-page, which is then aggregated by a **Node.js backend** and displayed in a **React Native (Expo)** app.

## 2. Architecture

### 2.1 Frontend (Expo / React Native)
- **Screens:**
  - **Home (Parser Home):** PDF upload, live system logs, status feedback.
  - **Domains:** List of parsed documents (Fitness Plans, Receipts - future).
  - **Fitness Plan:** Detailed view of a parsed plan (Profile, Workouts, Nutrition, Debug).
  - **Settings:** App configuration and data management.
- **Tech Stack:** React Native, Expo, Lucide Icons, Async Storage.
- **Design:** "Dark Premium" UI with glassmorphism and vibrant accents.

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

1.  **Upload:** User selects PDF -> App sends to `POST /api/parse`.
2.  **Split:** Backend `PdfService` splits PDF into N pages.
3.  **Parse:** Backend `WorkerService` sends each page to Cloudflare Worker.
4.  **Merge:** Backend `MergeService` aggregates N page JSONs into one `UniversalFitnessPlan`.
    *   Arrays (workouts, meals) are concatenated.
    *   Objects (profile, meta) are filled if missing.
    *   Debug pages are appended.
5.  **Save:** Backend saves to SQLite.
6.  **Response:** Backend returns `{ planId, status, fitnessPlan: <DTO> }`.
7.  **Display:** App renders `FitnessPlanScreen` using the DTO.

## 5. Key Features

-   **Live Debugging:** "System Logs" on Home screen show real-time backend progress.
-   **Resilient Parsing:** "Unclassified" content is preserved; partial failures don't crash the app.
-   **Universal Support:** Handles various fitness plan formats via the generic schema.
-   **Local Storage:** Parsed plans are cached locally on the device.

## 6. Setup & Commands

-   **Backend:** `cd backend && npm run dev` (Port 4000)
-   **Frontend:** `npx expo start` (Metro Bundler)
-   **Env:** `EXPO_PUBLIC_BACKEND_API_URL` must point to backend IP.

## 7. Troubleshooting

-   **"Cannot read property 'workouts' of undefined":** Backend failed to return a valid `fitnessPlan` DTO. Check `parse.controller.ts`.
-   **"Worker returned invalid JSON":** Worker failed or returned non-JSON. Check "System Logs".
-   **"Network Error":** Ensure phone/emulator is on same network as backend and IP is correct.

## 8. Development Log & Troubleshooting History (Nov 20, 2025)

### 8.1 Errors Faced & Resolutions

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| **Empty Fitness Plan Data** | Backend `merge.service.ts` was using old domain-based logic and ignoring Worker v3.0 schema. | **Rewrote `merge.service.ts`** to initialize a full `UniversalFitnessPlan` structure and merge page results by pushing to arrays (`workouts`, `nutrition_plan`, etc.) and shallow-merging objects. |
| **Frontend Freezing** | `LogViewer` was using `ScrollView` for thousands of logs, causing performance bottlenecks. | **Refactored `LogViewer`** to use `FlatList` for efficient rendering of large log datasets. |
| **500 Internal Server Error (Upload)** | Mismatch between frontend `FormData` field name (`pdf`) and backend `multer` configuration (`file`). | **Updated `parse.routes.ts`** to expect `upload.single('pdf')` matching the frontend. |
| **"Internal Server Error" (No Logs)** | Frontend `fetch` error handling was swallowing the response body on non-200 status. | **Updated `app/index.tsx`** to parse and display `logs` from the error response body even on failure. |
| **Sequential Processing Warning** | Backend was processing pages one-by-one. | **Added Performance Instrumentation** to `parse.controller.ts` to detect and warn about sequential processing (future optimization: parallelize worker calls). |

### 8.2 Key User Requests & Actions

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

### 8.3 Technical Explanations

*   **Worker v3 Schema:** The Cloudflare Worker now returns a flat, universal JSON structure for every page (e.g., `{ workouts: [], nutrition_plan: [], ... }`). It no longer uses the "domain" concept. The backend must respect this and simply aggregate the arrays.
*   **Merge Logic:** Since the worker returns partial data per page, the backend must initialize a "container" plan with empty arrays for all possible sections. It then iterates through each page's result and concatenates the arrays (e.g., `plan.workouts.push(...page.workouts)`).
*   **Multer Mismatch:** `multer` is strict about field names. If the client sends `pdf` but the server expects `file`, it throws an error before the controller is reached. This is why the custom logging logic wasn't triggering for the 500 error initially.

### 8.4 Current Status
*   **Backend:** Fully aligned with Universal v3.0 schema. Robust error handling and performance logging implemented.
*   **Frontend:** Displays backend logs, handles errors gracefully, and renders the full Universal Fitness Plan.
*   **Next Steps:** Verify end-to-end upload success and consider parallelizing worker calls if performance is slow.
