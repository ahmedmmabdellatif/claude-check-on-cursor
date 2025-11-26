# Correct Data Flow - Universal PDF Parser App

## Backend Responsibilities (ONLY)

The backend is a **thin proxy layer** that:
1. ✅ **Protects the OpenAI API key** (via Cloudflare Worker)
2. ✅ **Calls OpenAI** (forwards requests to Worker)
3. ✅ **Does logging** (captures and returns logs)
4. ✅ **Persists results** (saves to database)
5. ❌ **Does NOT split PDFs**
6. ❌ **Does NOT merge data**
7. ❌ **Does NOT process pages**

---

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: USER UPLOAD                                             │
└─────────────────────────────────────────────────────────────────┘

User selects PDF
    ↓
Frontend: DocumentPicker.getDocumentAsync()
    ↓
FormData created: { pdf: file }
    ↓
POST /api/parse
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: BACKEND RECEIVES (Minimal Processing)                 │
└─────────────────────────────────────────────────────────────────┘

Backend (Express + Multer)
    ↓
- Receives PDF buffer
- Validates: PDF MIME type, max 50MB
- Creates DB record: status='processing'
- Converts PDF to base64 (for transmission)
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: BACKEND → CLOUDFLARE WORKER                            │
└─────────────────────────────────────────────────────────────────┘

Backend sends entire PDF to Worker
    ↓
POST to Cloudflare Worker
URL: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
Body: {
  pdf_base64: "base64 encoded PDF",
  // OR
  // pages: [
  //   { page_number: 1, text: "...", image_base64: null },
  //   { page_number: 2, text: "...", image_base64: null },
  //   ...
  // ]
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: CLOUDFLARE WORKER PROCESSING                           │
└─────────────────────────────────────────────────────────────────┘

Cloudflare Worker receives request
    ↓
Worker handles ALL processing:
    │
    ├─→ Split PDF into pages (if needed)
    │   - Extract text per page
    │   - Extract images per page (if needed)
    │
    ├─→ For each page:
    │   │
    │   ├─→ Build OpenAI API request:
    │   │   - Model: gpt-4.1-mini
    │   │   - Input: [
    │   │       { type: "input_text", text: UNIVERSAL_PARSE_INSTRUCTIONS },
    │   │       { type: "input_text", text: "PAGE_NUMBER: 1" },
    │   │       { type: "input_text", text: "PAGE_TEXT:\n..." }
    │   │     ]
    │   │   - Format: json_object
    │   │
    │   ├─→ POST to OpenAI Responses API
    │   │   URL: https://api.openai.com/v1/responses
    │   │   Headers: Authorization: Bearer ${OPENAI_API_KEY}
    │   │
    │   ├─→ OpenAI processes page text
    │   │   - Analyzes content
    │   │   - Extracts structured data
    │   │   - Returns Universal Fitness Schema JSON (partial)
    │   │
    │   └─→ Collect page results
    │
    ├─→ Merge all page results
    │   - Concatenate arrays (workouts, meals, etc.)
    │   - Merge objects (meta, profile)
    │   - Aggregate debug.pages[]
    │
    └─→ Return complete UniversalFitnessPlan
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: WORKER → BACKEND                                       │
└─────────────────────────────────────────────────────────────────┘

Worker returns complete plan
    ↓
HTTP 200 Response:
{
  // Complete UniversalFitnessPlan
  "meta": { ... },
  "profile": { ... },
  "workouts": [ ... ],
  "nutrition_plan": [ ... ],
  "cardio_sessions": [ ... ],
  "mobility_and_rehab": [ ... ],
  "stretching_routines": [ ... ],
  "education_and_guidelines": [ ... ],
  "other_information": [ ... ],
  "unclassified": [ ... ],
  "debug": {
    "pages": [ ... ]
  }
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: BACKEND PERSISTENCE & LOGGING                          │
└─────────────────────────────────────────────────────────────────┘

Backend receives complete plan
    ↓
- Logs: Capture all processing logs
- Extract metadata: title, coach_name, etc.
- Save to SQLite:
  UPDATE ParsedPlan SET
    status = 'completed',
    rawJson = JSON.stringify(fitnessPlan),
    debugJson = JSON.stringify(debugJson),
    metaTitle = extractedTitle,
    metaCoachName = extractedCoachName,
    pagesCount = fitnessPlan.debug?.pages?.length || 0,
    updatedAt = now
  WHERE id = planId
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: BACKEND → FRONTEND                                     │
└─────────────────────────────────────────────────────────────────┘

Backend returns response
    ↓
HTTP 200 Response:
{
  "status": "success",
  "planId": "c[timestamp][random]",
  "fitnessPlan": {
    // Complete UniversalFitnessPlan from Worker
    "meta": { ... },
    "profile": { ... },
    "workouts": [ ... ],
    "nutrition_plan": [ ... ],
    ...
  },
  "logs": [
    "[timestamp] Received PDF: filename.pdf",
    "[timestamp] Sending to Worker...",
    "[timestamp] Worker responded successfully",
    "[timestamp] Saving to database...",
    ...
  ]
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: FRONTEND PROCESSING                                    │
└─────────────────────────────────────────────────────────────────┘

Frontend receives response
    ↓
- Extracts fitnessPlan
- Displays logs in LogViewer
- Saves to AsyncStorage:
  {
    id: planId,
    name: filename,
    timestamp: Date.now(),
    plan: fitnessPlan
  }
- Navigates to FitnessPlanScreen
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 9: TEMPLATE DISPLAY                                       │
└─────────────────────────────────────────────────────────────────┘

FitnessPlanScreen receives plan
    ↓
Maps fitnessPlan to template structure:
    │
    ├─→ Overview: meta, profile, assessment_and_background
    ├─→ Workouts: workouts[]
    ├─→ Nutrition: nutrition_plan[], supplements[]
    ├─→ Cardio: cardio_sessions[]
    ├─→ Rehab: mobility_and_rehab[], stretching_routines[]
    ├─→ Education: education_and_guidelines[]
    └─→ Debug: debug.pages[]
    ↓
User can view, track, edit all sections
```

---

## Key Differences from Previous Flow

### ❌ OLD (Incorrect)
- Backend splits PDF into pages
- Backend sends pages one-by-one to Worker
- Backend merges page results
- Backend does heavy processing

### ✅ NEW (Correct)
- **Backend receives PDF, sends to Worker (that's it)**
- **Worker splits PDF into pages**
- **Worker processes each page with OpenAI**
- **Worker merges all page results**
- **Worker returns complete plan**
- **Backend just saves and returns**

---

## Backend Code Structure (Simplified)

```typescript
// parse.controller.ts
async parsePdf(req: Request, res: Response) {
  // 1. Receive PDF
  const fileBuffer = req.file.buffer;
  const pdfBase64 = fileBuffer.toString('base64');
  
  // 2. Create DB record
  const planId = generateId();
  db.insert('processing', planId);
  
  // 3. Send to Worker (ONE CALL)
  const fitnessPlan = await workerService.parsePdf(pdfBase64);
  
  // 4. Save result
  db.update('completed', planId, fitnessPlan);
  
  // 5. Return
  res.json({ status: 'success', planId, fitnessPlan, logs });
}
```

```typescript
// worker.service.ts
async parsePdf(pdfBase64: string) {
  // Just forward to Worker
  const response = await axios.post(WORKER_URL, {
    pdf_base64: pdfBase64
  });
  
  return response.data; // Complete plan from Worker
}
```

---

## Worker Responsibilities

The Cloudflare Worker handles:
1. ✅ **PDF Splitting** - Split PDF into pages
2. ✅ **Text Extraction** - Extract text from each page
3. ✅ **Image Extraction** - Extract images (if needed)
4. ✅ **OpenAI Calls** - Call OpenAI API for each page
5. ✅ **Data Merging** - Merge all page results
6. ✅ **Complete Plan** - Return full UniversalFitnessPlan

---

## Data Structures

### Backend → Worker
```typescript
{
  pdf_base64: string  // Entire PDF as base64
}
```

### Worker → Backend
```typescript
UniversalFitnessPlan {
  // Complete merged plan
  meta: { ... },
  profile: { ... },
  workouts: [ ... ],
  nutrition_plan: [ ... ],
  ...
  debug: {
    pages: [ ... ]  // All pages processed
  }
}
```

### Backend → Frontend
```typescript
{
  status: "success",
  planId: string,
  fitnessPlan: UniversalFitnessPlan,  // From Worker
  logs: string[]
}
```

---

## Summary

**Backend = Thin Proxy:**
- Receives PDF
- Sends to Worker
- Saves result
- Returns to frontend

**Worker = Heavy Lifting:**
- Splits PDF
- Processes pages
- Merges results
- Returns complete plan

**Frontend = Display:**
- Receives complete plan
- Maps to template
- Displays to user

