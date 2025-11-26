# Final Data Flow - Universal PDF Parser App

## Critical Requirement

**OpenAI MUST process each page individually** - otherwise it ignores most of the PDF content.

Therefore:
- ✅ **Worker receives full PDF** and splits it internally
- ✅ **Worker processes each page** with OpenAI (one-by-one)
- ✅ **Worker merges all page results**
- ✅ **Backend just forwards PDF** to Worker (no processing)
- ✅ **Frontend just displays** (no processing)

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
│ PHASE 2: BACKEND RECEIVES (Minimal - Just Forwarding)           │
└─────────────────────────────────────────────────────────────────┘

Backend (Express + Multer)
    ↓
- Receives PDF buffer
- Validates: PDF MIME type, max 50MB
- Creates DB record: status='processing'
- Converts PDF buffer to base64 string
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: BACKEND → CLOUDFLARE WORKER (ONE CALL)                │
└─────────────────────────────────────────────────────────────────┘

Backend sends entire PDF to Worker
    ↓
POST to Cloudflare Worker
URL: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
Body: {
  pdf_base64: "base64 encoded entire PDF"
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: WORKER SPLITS PDF INTERNALLY                            │
└─────────────────────────────────────────────────────────────────┘

Cloudflare Worker receives PDF
    ↓
Worker splits PDF into pages:
    │
    ├─→ Use PDF parsing library (pdf-parse or similar)
    ├─→ Extract text from each page
    ├─→ Extract images from each page (if needed)
    └─→ Create pages array:
        [
          { pageNumber: 1, text: "...", imageBase64: null },
          { pageNumber: 2, text: "...", imageBase64: null },
          { pageNumber: 3, text: "...", imageBase64: null },
          ...
        ]
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: WORKER PROCESSES EACH PAGE WITH OPENAI                 │
└─────────────────────────────────────────────────────────────────┘

For EACH page (sequentially - one at a time):
    │
    ├─→ Build OpenAI API request for this page:
    │   {
    │     model: "gpt-4.1-mini",
    │     input: [{
    │       role: "user",
    │       content: [
    │         { type: "input_text", text: UNIVERSAL_PARSE_INSTRUCTIONS },
    │         { type: "input_text", text: "PAGE_NUMBER: 1" },
    │         { type: "input_text", text: "PAGE_TEXT:\n[page 1 text]" },
    │         { type: "input_image", image: "[page 1 image if exists]" }
    │       ]
    │     }],
    │     text: { format: { type: "json_object" } }
    │   }
    │
    ├─→ POST to OpenAI Responses API
    │   URL: https://api.openai.com/v1/responses
    │   Headers: Authorization: Bearer ${OPENAI_API_KEY}
    │
    ├─→ OpenAI processes THIS PAGE ONLY
    │   - Analyzes page content
    │   - Extracts structured data from this page
    │   - Returns Universal Fitness Schema JSON (partial for this page)
    │
    └─→ Worker receives partial plan for this page:
        {
          meta: { ... },           // Only from this page
          profile: { ... },        // Only from this page
          workouts: [ ... ],       // Only workouts from this page
          nutrition_plan: [ ... ], // Only meals from this page
          cardio_sessions: [ ... ],
          ...
          debug: {
            pages: [{
              page_number: 1,
              raw_text: "[page 1 text]",
              detected_elements: [],
              mapped_to: [],
              notes: "..."
            }]
          }
        }
    ↓
    (Repeat for page 2, page 3, ... page N)
    ↓
Result: Array of partial plans = [page1Plan, page2Plan, page3Plan, ...]
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: WORKER MERGES ALL PAGE RESULTS                         │
└─────────────────────────────────────────────────────────────────┘

Worker merges all partial plans:
    │
    ├─→ Initialize empty UniversalFitnessPlan template
    │
    ├─→ For each page result:
    │   │
    │   ├─→ Arrays: Concatenate
    │   │   - workouts.push(...page.workouts)
    │   │   - nutrition_plan.push(...page.nutrition_plan)
    │   │   - cardio_sessions.push(...page.cardio_sessions)
    │   │   - mobility_and_rehab.push(...page.mobility_and_rehab)
    │   │   - stretching_routines.push(...page.stretching_routines)
    │   │   - education_and_guidelines.push(...page.education_and_guidelines)
    │   │   - unclassified.push(...page.unclassified)
    │   │
    │   ├─→ Objects: Merge (first non-empty wins)
    │   │   - meta: Fill empty fields
    │   │   - profile: Fill empty fields, concatenate arrays
    │   │   - assessment_and_background: Deep merge
    │   │   - food_sources: Shallow merge
    │   │
    │   └─→ Debug: Aggregate
    │       - debug.pages.push(...page.debug.pages)
    │
    └─→ Result: Complete UniversalFitnessPlan
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: WORKER → BACKEND                                       │
└─────────────────────────────────────────────────────────────────┘

Worker returns complete merged plan
    ↓
HTTP 200 Response:
{
  // Complete UniversalFitnessPlan (all pages merged)
  "meta": { ... },
  "profile": { ... },
  "workouts": [ /* all workouts from all pages */ ],
  "nutrition_plan": [ /* all meals from all pages */ ],
  "cardio_sessions": [ /* all cardio from all pages */ ],
  "mobility_and_rehab": [ /* all rehab from all pages */ ],
  "stretching_routines": [ /* all stretching from all pages */ ],
  "education_and_guidelines": [ /* all education from all pages */ ],
  "other_information": [ /* all other info from all pages */ ],
  "unclassified": [ /* all unclassified from all pages */ ],
  "debug": {
    "pages": [
      { page_number: 1, raw_text: "...", ... },
      { page_number: 2, raw_text: "...", ... },
      { page_number: 3, raw_text: "...", ... },
      ...
    ]
  }
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: BACKEND PERSISTENCE & LOGGING                          │
└─────────────────────────────────────────────────────────────────┘

Backend receives complete plan from Worker
    ↓
- Logs: "[timestamp] Received complete plan from Worker"
- Extract metadata: title, coach_name, etc.
- Calculate pagesCount: fitnessPlan.debug?.pages?.length || 0
- Save to SQLite:
  UPDATE ParsedPlan SET
    status = 'completed',
    rawJson = JSON.stringify(fitnessPlan),
    debugJson = JSON.stringify(fitnessPlan.debug),
    metaTitle = fitnessPlan.meta?.title || 'Untitled Plan',
    metaCoachName = fitnessPlan.meta?.coach_name || null,
    pagesCount = pagesCount,
    updatedAt = now
  WHERE id = planId
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 9: BACKEND → FRONTEND                                     │
└─────────────────────────────────────────────────────────────────┘

Backend returns response
    ↓
HTTP 200 Response:
{
  "status": "success",
  "planId": "c[timestamp][random]",
  "fitnessPlan": {
    // Complete UniversalFitnessPlan from Worker (all pages merged)
    "meta": { ... },
    "profile": { ... },
    "workouts": [ /* all workouts */ ],
    "nutrition_plan": [ /* all meals */ ],
    "cardio_sessions": [ /* all cardio */ ],
    "mobility_and_rehab": [ /* all rehab */ ],
    "stretching_routines": [ /* all stretching */ ],
    "education_and_guidelines": [ /* all education */ ],
    "other_information": [ /* all other info */ ],
    "unclassified": [ /* all unclassified */ ],
    "debug": {
      "pages": [ /* all pages */ ]
    }
  },
  "logs": [
    "[timestamp] Received PDF: filename.pdf",
    "[timestamp] Sending to Worker...",
    "[timestamp] Worker responded successfully",
    "[timestamp] Saving to database...",
    "[timestamp] Plan saved with X pages"
  ]
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 10: FRONTEND PROCESSING                                    │
└─────────────────────────────────────────────────────────────────┘

Frontend receives response
    ↓
- Extracts fitnessPlan (complete, all pages merged)
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
│ PHASE 11: TEMPLATE DISPLAY                                       │
└─────────────────────────────────────────────────────────────────┘

FitnessPlanScreen receives complete plan
    ↓
Maps fitnessPlan to template structure:
    │
    ├─→ Overview: meta, profile, assessment_and_background
    ├─→ Workouts: workouts[] (all workouts from all pages)
    ├─→ Nutrition: nutrition_plan[] (all meals from all pages)
    ├─→ Cardio: cardio_sessions[] (all cardio from all pages)
    ├─→ Rehab: mobility_and_rehab[], stretching_routines[]
    ├─→ Education: education_and_guidelines[]
    └─→ Debug: debug.pages[] (shows all pages processed)
    ↓
User can view, track, edit all sections
```

---

## Key Points

### ✅ Worker Responsibilities
1. **Receives full PDF** as base64
2. **Splits PDF internally** into pages
3. **Processes each page** with OpenAI (one-by-one, sequentially)
4. **Merges all page results** into complete plan
5. **Returns complete UniversalFitnessPlan**

### ✅ Backend Responsibilities (Minimal)
1. **Receives PDF upload**
2. **Converts to base64**
3. **Sends to Worker** (one call)
4. **Saves result** to database
5. **Returns to frontend**

### ✅ Frontend Responsibilities
1. **Uploads PDF**
2. **Displays complete plan**
3. **Allows tracking/editing**

---

## Why Page-by-Page Processing?

**OpenAI API Limitation:**
- If you send entire PDF at once → OpenAI ignores most content
- If you send each page individually → OpenAI processes every page fully
- **Therefore: Worker MUST process page-by-page**

---

## Worker Code Structure (What It Should Do)

```javascript
export default {
  async fetch(req, env) {
    // 1. Receive PDF
    const { pdf_base64 } = await req.json();
    
    // 2. Split PDF into pages
    const pages = await splitPdf(pdf_base64);
    // Returns: [{ pageNumber: 1, text: "...", imageBase64: null }, ...]
    
    // 3. Process each page with OpenAI
    const pageResults = [];
    for (const page of pages) {
      const result = await callOpenAI(page);
      pageResults.push(result);
    }
    
    // 4. Merge all page results
    const completePlan = mergePageResults(pageResults);
    
    // 5. Return complete plan
    return new Response(JSON.stringify(completePlan));
  }
}
```

---

## Data Structures

### Backend → Worker
```typescript
{
  pdf_base64: string  // Entire PDF as base64
}
```

### Worker Internal Processing
```typescript
// After splitting:
pages = [
  { pageNumber: 1, text: "...", imageBase64: null },
  { pageNumber: 2, text: "...", imageBase64: null },
  ...
]

// After OpenAI processing each page:
pageResults = [
  { meta: {...}, workouts: [...], ... },  // Page 1 result
  { meta: {...}, workouts: [...], ... },  // Page 2 result
  ...
]

// After merging:
completePlan = {
  meta: { ... },  // Merged from all pages
  workouts: [ /* all workouts from all pages */ ],
  nutrition_plan: [ /* all meals from all pages */ ],
  ...
  debug: {
    pages: [ /* all pages */ ]
  }
}
```

### Worker → Backend
```typescript
UniversalFitnessPlan {
  // Complete merged plan (all pages)
}
```

### Backend → Frontend
```typescript
{
  status: "success",
  planId: string,
  fitnessPlan: UniversalFitnessPlan,  // Complete plan from Worker
  logs: string[]
}
```

---

## Summary

**Flow:**
1. Frontend uploads PDF
2. Backend forwards PDF to Worker (one call)
3. **Worker splits PDF internally**
4. **Worker processes each page with OpenAI** (one-by-one)
5. **Worker merges all results**
6. Worker returns complete plan
7. Backend saves and returns
8. Frontend displays

**Key:** Worker handles ALL processing. Backend is just a proxy.

