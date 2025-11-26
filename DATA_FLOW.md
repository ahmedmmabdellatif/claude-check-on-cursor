# Exact Data Flow - AI Fitness PDF Parser

## Overview
This document describes the **exact data flow** through the entire system, from user upload to final display.

---

## Architecture Components

1. **Frontend**: React Native (Expo) app (`app/`)
2. **Backend**: Node.js/Express server (`backend/`)
3. **Cloudflare Worker**: AI parsing service (`cloudflare-worker.js`)
4. **Database**: SQLite (`backend/dev.db`)

---

## Complete Data Flow

### Phase 1: User Upload (Frontend → Backend)

**Location**: `app/index.tsx` → `backend/src/routes/parse.routes.ts`

1. **User Action**: User selects PDF via `DocumentPicker.getDocumentAsync()`
   - File stored in `selectedFile` state
   - File metadata: `name`, `uri`, `size`, `mimeType`

2. **FormData Creation** (`app/index.tsx:101-106`):
   ```typescript
   formData.append('pdf', {
     uri: selectedFile.uri,
     name: selectedFile.name,
     type: selectedFile.mimeType || 'application/pdf',
   })
   ```

3. **HTTP Request** (`app/index.tsx:111-117`):
   - **Method**: `POST`
   - **URL**: `${BACKEND_API_URL}/api/parse` (default: `http://localhost:4000/api/parse`)
   - **Body**: `FormData` with field name `'pdf'`
   - **Headers**: `Accept: application/json`

4. **Backend Receives** (`backend/src/routes/parse.routes.ts:24`):
   - **Multer Middleware**: `upload.single('pdf')` (field name must match!)
   - **Storage**: Memory storage (50MB max)
   - **Validation**: Only `application/pdf` MIME type allowed
   - **Result**: `req.file.buffer` (PDF as Buffer), `req.file.originalname`

---

### Phase 2: PDF Processing (Backend)

**Location**: `backend/src/controllers/parse.controller.ts`

#### Step 2.1: Initial Database Record
- **Action**: Creates placeholder record in SQLite
- **Table**: `ParsedPlan`
- **Status**: `'processing'`
- **Fields**: `id` (generated), `createdAt`, `sourceFilename`, `pagesCount: 0`, `rawJson: '{}'`, `debugJson: '{}'`

#### Step 2.2: PDF Splitting (`backend/src/services/pdf.service.ts`)

**Input**: `fileBuffer` (Buffer)

**Process**:
1. Uses `pdf-parse` library to extract text
2. Gets total page count: `data.numpages`
3. Splits text by estimated characters per page
4. Creates `PageData[]` array:
   ```typescript
   {
     pageNumber: number,      // 1-based
     imageBase64: null,        // Not implemented yet
     text: string             // Extracted text for this page
   }
   ```

**Output**: Array of `PageData` objects (one per page)

**Logs**: `[PDFService] Split into N pages`

---

### Phase 3: AI Parsing (Backend → Cloudflare Worker)

**Location**: `backend/src/services/worker.service.ts` → `cloudflare-worker.js`

#### Step 3.1: Sequential Page Processing

For each page in `PageData[]`:

1. **Request to Worker** (`worker.service.ts:18-29`):
   - **URL**: `https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/`
   - **Method**: `POST`
   - **Payload**:
     ```json
     {
       "page_number": 1,
       "image_base64": null,
       "text": "Page text content..."
     }
     ```
   - **Timeout**: 60 seconds
   - **Headers**: `Content-Type: application/json`

2. **Worker Processing** (`cloudflare-worker.js:158-314`):
   - Receives JSON payload
   - Validates: `page_number` required, `image_base64` or `text` required
   - Builds OpenAI API request:
     - **Model**: `gpt-4.1-mini`
     - **Input**: 
       - Instructions (PARSE_INSTRUCTIONS)
       - Page number
       - Page text
       - Image (if provided)
     - **Format**: `json_object`
   - Calls OpenAI Responses API: `https://api.openai.com/v1/responses`
   - Parses JSON response
   - **Returns**: JSON object with structure (see note below)

3. **Worker Response Structure**:
   **⚠️ NOTE**: There's a discrepancy in the codebase:
   - `cloudflare-worker.js` returns: `{ domains: [...] }` (domain-based structure)
   - `worker.service.ts` expects: `UniversalFitnessPlan` (direct structure with `meta`, `workouts`, etc.)
   - `merge.service.ts` expects: `UniversalFitnessPlan` structure
   
   **Current Implementation**: The worker service validates for keys like `meta`, `profile`, `workouts`, `nutrition_plan`, `debug` but the worker code returns `domains[]`. This suggests either:
   - The worker code needs updating, OR
   - The backend needs transformation logic (currently missing)

4. **Error Handling**: If worker fails, returns fallback:
   ```typescript
   {
     unclassified: [pageData.text],
     debug: {
       pages: [{
         page_number: pageData.pageNumber,
         raw_text: pageData.text,
         notes: "FAILED TO PARSE: [error]"
       }]
     }
   }
   ```

**Output**: Array of `PageParseResponse[]` (one per page)

**Logs**: 
- `[WorkerService] Starting page N at [timestamp]`
- `[WorkerService] Page N completed in X ms`
- `[WorkerService] Finished page N (Total: X ms)`

**⚠️ Performance**: Pages are processed **sequentially** (one at a time), not in parallel.

---

### Phase 4: Data Merging (Backend)

**Location**: `backend/src/services/merge.service.ts`

#### Step 4.1: Initialize Empty Plan
Creates `UniversalFitnessPlan` with all fields initialized:
- `meta`: `{ title: "", subtitle: "", ... }`
- `profile`: `{ trainee_name: "", age: "", ... }`
- `assessment_and_background`: Full nested structure
- Arrays: `workouts: []`, `nutrition_plan: []`, `cardio_sessions: []`, etc.
- `debug: { pages: [] }`

#### Step 4.2: Merge Each Page Result

For each `PageParseResponse` in `pageResults[]`:

1. **Meta & Profile**: First non-empty value wins, later pages fill missing fields
   - `mergeMeta()`: Shallow merge, only fills empty fields
   - `mergeProfile()`: Arrays concatenated, strings filled if empty

2. **Assessment & Background**: Deep merge of nested objects
   - `health_status`, `fitness_status`, etc.: Array concatenation
   - `demographics`: Shallow merge

3. **Arrays**: Direct concatenation
   - `workouts.push(...page.workouts)`
   - `nutrition_plan.push(...page.nutrition_plan)`
   - `cardio_sessions.push(...page.cardio_sessions)`
   - `mobility_and_rehab.push(...page.mobility_and_rehab)`
   - `stretching_routines.push(...page.stretching_routines)`
   - `education_and_guidelines.push(...page.education_and_guidelines)`
   - `unclassified.push(...page.unclassified)`

4. **Objects**: Shallow merge
   - `food_sources`: `{ ...plan.food_sources, ...page.food_sources }`

5. **Debug Pages**: Concatenate all `debug.pages[]` arrays

**Output**: Single `UniversalFitnessPlan` object with all pages merged

**Logs**: `[Merge] Result counts: { workouts: N, meals: M, ... }`

---

### Phase 5: Database Storage (Backend)

**Location**: `backend/src/controllers/parse.controller.ts:80-97`

1. **Extract Metadata**:
   - `metaTitle`: `mergedResult.meta?.title || 'Untitled Plan'`
   - `metaCoachName`: `mergedResult.meta?.coach_name || null`
   - `metaDurationWeeks`: `null` (not extracted currently)

2. **Update Database Record**:
   ```sql
   UPDATE ParsedPlan
   SET status = 'completed',
       rawJson = JSON.stringify(mergedResult),
       debugJson = JSON.stringify(debugJson),
       metaTitle = ?,
       metaCoachName = ?,
       metaDurationWeeks = ?,
       updatedAt = ?
   WHERE id = ?
   ```

3. **Database Schema** (`backend/prisma/schema.prisma`):
   - `rawJson`: Full `UniversalFitnessPlan` as JSON string
   - `debugJson`: Debug data with page summaries
   - `status`: `'completed'` or `'failed'`

---

### Phase 6: Response to Frontend (Backend → Frontend)

**Location**: `backend/src/controllers/parse.controller.ts:110-115`

**Response Structure**:
```json
{
  "status": "success",
  "planId": "c[timestamp][random]",
  "fitnessPlan": {
    // Full UniversalFitnessPlan object
    "meta": { ... },
    "profile": { ... },
    "workouts": [ ... ],
    "nutrition_plan": [ ... ],
    // ... all merged data
  },
  "logs": [
    "[timestamp] [PDFService] Splitting PDF into pages...",
    "[timestamp] [PDFService] Split into 5 pages",
    // ... all backend logs
  ]
}
```

**Error Response** (if processing fails):
```json
{
  "error": "Failed to process PDF",
  "message": "Error details...",
  "planId": "...",
  "logs": [ ... ]
}
```

**Logs**: All console.log statements from backend are captured in `logs[]` array and returned to frontend.

---

### Phase 7: Frontend Processing

**Location**: `app/index.tsx:108-158`

#### Step 7.1: Receive Response
1. Parse JSON: `const data = await response.json()`
2. Extract logs: `data.logs` (array of log strings)
3. Display logs: Each log added to `logs` state, shown in `LogViewer` component

#### Step 7.2: Success Handling
If `response.ok && (data.status === 'success' || data.status === 'parsed')`:

1. **Set Active Plan**: `setActivePlan(data.fitnessPlan)`
2. **Save to Local Storage** (`AsyncStorage`):
   ```typescript
   const docEntry = {
     id: data.planId,
     name: selectedFile.name,
     timestamp: Date.now(),
     plan: data.fitnessPlan
   }
   await AsyncStorage.setItem(
     `parsed_doc_${data.planId}`,
     JSON.stringify(docEntry)
   )
   ```
3. **Reload Documents**: `loadAllDocuments()` - reads all `parsed_doc_*` keys from AsyncStorage
4. **Navigate**: `setCurrentScreen('fitness')` - switches to FitnessPlanScreen

#### Step 7.3: Error Handling
- Sets `error` state with error message
- Adds error log entry
- Logs to console

---

### Phase 8: Display (Frontend)

**Location**: `components/screens/FitnessPlanScreen.tsx`

1. **Screen Navigation**: User is on `'fitness'` screen
2. **Component**: `FitnessPlanScreen` receives `plan={activePlan}`
3. **Rendering**: 
   - Uses specialized components:
     - `OverviewSection`: Meta and profile
     - `WorkoutsSection`: List of workouts with exercises
     - `NutritionSection`: Meal plans
     - `GenericSection`: Other sections (cardio, supplements, etc.)
   - Each section renders the structured data from `UniversalFitnessPlan`

---

## Data Retrieval Flow (Viewing Saved Plans)

### Step 1: Load from Storage
**Location**: `app/index.tsx:42-61`

1. **Get All Keys**: `AsyncStorage.getAllKeys()`
2. **Filter**: Keys starting with `"parsed_doc_"`
3. **Multi-Get**: `AsyncStorage.multiGet(docKeys)`
4. **Parse**: Each value is JSON-parsed
5. **Sort**: By `timestamp` (newest first)
6. **State**: `setDocuments(parsedDocs)`

### Step 2: Display List
**Location**: `components/screens/DomainsScreen.tsx`

- Shows list of saved documents
- Each item: `name`, `timestamp`
- User can select a document

### Step 3: View Plan
**Location**: `app/index.tsx:179-182`

When user selects document:
1. `setActivePlan(doc.plan)` - Sets the full plan from storage
2. `setCurrentScreen('fitness')` - Navigates to fitness screen
3. `FitnessPlanScreen` renders the plan

### Alternative: Backend API Retrieval
**Location**: `backend/src/controllers/plan.controller.ts`

**Endpoint**: `GET /api/plans/:id`

1. Query database: `SELECT * FROM ParsedPlan WHERE id = ?`
2. Parse `rawJson`: `JSON.parse(plan.rawJson)`
3. Return:
   ```json
   {
     "planId": "...",
     "fitnessPlan": { ... },
     "status": "completed",
     "createdAt": "..."
   }
   ```

**Note**: Frontend currently uses AsyncStorage, not this API endpoint.

---

## Key Data Structures

### UniversalFitnessPlan
```typescript
{
  meta: { title, subtitle, author, ... },
  profile: { trainee_name, age, gender, ... },
  assessment_and_background: { ... },
  workouts: Workout[],
  nutrition_plan: Meal[],
  cardio_sessions: Cardio[],
  mobility_and_rehab: Rehab[],
  stretching_routines: Stretch[],
  education_and_guidelines: string[],
  unclassified: string[],
  debug: { pages: PageSummary[] }
}
```

### PageData (Internal)
```typescript
{
  pageNumber: number,
  imageBase64: string | null,
  text: string
}
```

### PageParseResponse
Currently aliased to `UniversalFitnessPlan` (each page returns a partial plan).

---

## Performance Characteristics

1. **Sequential Processing**: Pages processed one-by-one (not parallel)
   - **Warning**: Logged in controller: `"WARNING: Pages processed sequentially. Consider parallelism."`
   - **Impact**: Total time = sum of all page processing times

2. **Timing Logs**:
   - Per-page: Start/end timestamps logged
   - Total pipeline: `TOTAL pipeline time: X ms`
   - Average: `Avg per page: X ms/page`

3. **Database**: SQLite (file-based, local)

4. **Storage**: 
   - Backend: SQLite database
   - Frontend: AsyncStorage (device local storage)

---

## Error Handling Points

1. **PDF Upload**: Multer validation (file type, size)
2. **PDF Parsing**: `pdf-parse` errors caught, thrown as "Failed to split PDF"
3. **Worker Calls**: Timeout (60s), network errors → fallback object returned
4. **JSON Parsing**: Worker response validation, fallback on parse failure
5. **Database**: SQLite errors caught, status set to `'failed'`
6. **Frontend**: Network errors, JSON parse errors, storage errors

---

## Known Issues / Discrepancies

1. **Worker Response Format Mismatch**:
   - Worker code (`cloudflare-worker.js`) returns `{ domains: [...] }`
   - Backend expects `UniversalFitnessPlan` directly
   - **Status**: Backend validates for expected keys but may fail if worker returns domains structure

2. **Sequential Processing**: 
   - All pages processed one-by-one
   - Could be parallelized for better performance

3. **Image Support**: 
   - `imageBase64` is always `null` in PDF service
   - Worker supports images but backend doesn't extract them yet

---

## Environment Variables

- **Frontend**: `EXPO_PUBLIC_BACKEND_API_URL` (default: `http://localhost:4000`)
- **Backend**: `WORKER_URL` (hardcoded: `https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/`)
- **Worker**: `OPENAI_API_KEY` (Cloudflare Worker environment variable)

---

## Summary Flow Diagram

```
User Upload PDF
    ↓
Frontend: FormData → POST /api/parse
    ↓
Backend: Multer → ParseController
    ↓
PDFService: Split into pages[]
    ↓
For each page:
    WorkerService → Cloudflare Worker → OpenAI API
    ↓
MergeService: Aggregate all page results
    ↓
Database: Save to SQLite (ParsedPlan table)
    ↓
Response: { status, planId, fitnessPlan, logs }
    ↓
Frontend: Save to AsyncStorage, Display in FitnessPlanScreen
```

---

**Last Updated**: Based on codebase analysis
**Version**: 1.0.0

