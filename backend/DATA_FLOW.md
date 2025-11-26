# Backend Data Flow - Worker v5.2 Architecture

## Overview

The backend acts as a **thin proxy** between the frontend and the Cloudflare Worker. It handles:
- PDF upload reception
- API key protection (Worker handles OpenAI calls)
- Logging
- Database persistence
- **No PDF parsing, splitting, or merging** - all semantic understanding is done by the Worker

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: FRONTEND → BACKEND (PDF Upload)                        │
└─────────────────────────────────────────────────────────────────┘

Frontend (Expo App)
    ↓
POST /api/parse
Content-Type: multipart/form-data
Body: { pdf: File }
    ↓
Backend: Multer middleware
    ↓
Extract: fileBuffer, filename
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: BACKEND → CLOUDFLARE WORKER (Single Call)             │
└─────────────────────────────────────────────────────────────────┘

Backend converts PDF buffer to base64
    ↓
POST to Cloudflare Worker v5.2
URL: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
Body: {
  pdf_base64: "<base64 string, no data URI>",
  filename: "fitness-plan.pdf" // optional
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: WORKER PROCESSING (Internal to Worker)                │
└─────────────────────────────────────────────────────────────────┘

Cloudflare Worker receives full PDF
    ↓
Worker sends entire PDF to OpenAI Responses API
    ↓
OpenAI processes PDF (handles page-by-page internally)
    ↓
OpenAI returns complete UniversalFitnessPlan JSON
    ↓
Worker returns JSON to Backend
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: BACKEND PROCESSING (Storage & Response)                │
└─────────────────────────────────────────────────────────────────┘

Backend receives UniversalFitnessPlan JSON
    ↓
Extract metadata (title, coach_name, pagesCount from debug.pages)
    ↓
Save to SQLite:
  - status = 'completed'
  - rawJson = JSON.stringify(fitnessPlan)
  - debugJson = JSON.stringify(fitnessPlan.debug)
  - metaTitle, metaCoachName, pagesCount
    ↓
Return to Frontend:
  {
    status: 'success',
    planId: string,
    fitnessPlan: UniversalFitnessPlan, // Complete plan from Worker
    logs: string[]
  }
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: FRONTEND DISPLAY                                        │
└─────────────────────────────────────────────────────────────────┘

Frontend receives response
    ↓
Store in AsyncStorage
    ↓
Display in UI:
  - Overview: fitnessPlan.meta, fitnessPlan.profile
  - Workouts: fitnessPlan.workouts
  - Nutrition: fitnessPlan.nutrition_plan, fitnessPlan.food_sources
  - Cardio: fitnessPlan.cardio_sessions
  - Rehab: fitnessPlan.mobility_and_rehab, fitnessPlan.stretching_routines
  - Education: fitnessPlan.education_and_guidelines
  - Debug: fitnessPlan.debug.pages
  - JSON: fitnessPlan (pretty-printed)
```

---

## Key Architecture Decisions

### ✅ Backend Responsibilities
1. **PDF Upload Reception**: Multer middleware handles file upload
2. **Base64 Conversion**: Convert PDF buffer to base64 string (no data URI)
3. **Worker Communication**: Single POST request to Worker with full PDF
4. **Logging**: Collect logs throughout the process
5. **Database Persistence**: Store complete plan JSON in SQLite
6. **Error Handling**: Handle Worker errors and return appropriate HTTP status codes

### ❌ Backend Does NOT Do
1. **PDF Splitting**: No page-by-page extraction
2. **AI Parsing**: No semantic understanding of PDF content
3. **Merging**: No merging of partial results
4. **Data Transformation**: Worker JSON is used as-is (single source of truth)

---

## Worker Contract (v5.2)

### Request
```typescript
POST https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
Content-Type: application/json

{
  pdf_base64: string;  // Base64 encoded PDF (no data URI prefix)
  filename?: string;   // Optional filename for context
}
```

### Response
```typescript
{
  status: 200,
  body: UniversalFitnessPlan  // Complete plan JSON
}
```

### UniversalFitnessPlan Structure
```typescript
interface UniversalFitnessPlan {
  meta?: object;
  profile?: object;
  assessment_and_background?: object;
  warmup_protocols?: any[];
  mobility_and_rehab?: any[];
  stretching_routines?: any[];
  cardio_sessions?: any[];
  weekly_schedule?: any[];
  workouts?: any[];
  nutrition_plan?: any[];
  food_sources?: object;
  education_and_guidelines?: any[];
  other_information?: any[];
  unclassified?: any[];
  debug?: {
    pages: Array<{
      page_number: number;
      raw_text: string;
      notes?: string;
    }>;
  };
}
```

---

## Database Schema

### ParsedPlan Table
- `id`: Unique identifier
- `sourceFilename`: Original PDF filename
- `pagesCount`: Number of pages (from `debug.pages.length`)
- `status`: 'processing' | 'completed' | 'failed'
- `rawJson`: Complete `UniversalFitnessPlan` JSON string
- `debugJson`: `fitnessPlan.debug` JSON string
- `metaTitle`: Extracted from `fitnessPlan.meta.title`
- `metaCoachName`: Extracted from `fitnessPlan.meta.coach_name`

---

## Error Handling

### Worker Errors
- **400 Bad Request**: Invalid request format → Backend returns 500 with error message
- **502 Bad Gateway**: OpenAI error → Backend returns 500 with Worker error details
- **Timeout**: 20 minute timeout → Backend returns 500 with timeout message

### Backend Errors
- **400**: No file uploaded
- **500**: Worker error, processing error, or critical error

All errors include:
- `error`: Error type
- `message`: Detailed error message
- `planId`: Plan ID (if created)
- `logs`: Array of log messages

---

## Files Modified

### Active Files
- `backend/src/controllers/parse.controller.ts`: Main endpoint handler
- `backend/src/services/worker.service.ts`: Worker communication

### Deprecated Files (No Longer Used)
- `backend/src/services/pdf.service.ts`: Page splitting (deprecated)
- `backend/src/services/merge.service.ts`: Result merging (deprecated)

These files are kept for reference but are **not imported or called** by the active code.

---

## Frontend Contract

The `/api/parse` endpoint returns:

```typescript
{
  status: 'success' | 'failed',
  planId: string,
  fitnessPlan: UniversalFitnessPlan,  // Complete plan from Worker
  logs: string[]                       // Backend + Worker logs
}
```

The frontend treats `fitnessPlan` as the **single source of truth** and reads directly from it without any backend-side transformation.

---

## Notes

- **Worker handles all AI processing**: The backend never interprets PDF content
- **No page-by-page calls**: Single call with full PDF
- **Worker JSON is canonical**: Backend stores and returns Worker response as-is
- **debug.pages comes from Worker**: Backend does not modify or add to debug.pages
- **Timeout**: 20 minutes for large PDFs (Worker processes internally)

