# Complete Data Flow - Universal PDF Parser App

## Overview

This app is a **universal PDF digitization tool** that:
1. Accepts PDFs with structured information (fitness plans, etc.)
2. Uses OpenAI (via Cloudflare Worker) to parse PDFs into structured JSON
3. Displays parsed data in a trackable, editable format
4. Allows users to track progress and edit information

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: USER UPLOAD                                            │
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
│ PHASE 2: BACKEND RECEIVES & PREPARES                           │
└─────────────────────────────────────────────────────────────────┘

Backend (Express + Multer)
    ↓
- Receives PDF buffer
- Validates: PDF MIME type, max 50MB
- Creates DB record: status='processing'
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: PDF SPLITTING                                          │
└─────────────────────────────────────────────────────────────────┘

PdfService.splitPdf(fileBuffer)
    ↓
- Uses pdf-parse library
- Extracts text from entire PDF
- Splits text by estimated page boundaries
- Returns: PageData[] = [
      { pageNumber: 1, text: "...", imageBase64: null },
      { pageNumber: 2, text: "...", imageBase64: null },
      ...
    ]
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: AI PARSING (Per Page)                                 │
└─────────────────────────────────────────────────────────────────┘

For EACH page in pages[]:
    │
    ├─→ WorkerService.parsePageWithWorker(pageData)
    │   │
    │   ├─→ HTTP POST to Cloudflare Worker
    │   │   URL: https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/
    │   │   Body: {
    │   │     page_number: 1,
    │   │     text: "extracted text from page 1",
    │   │     image_base64: null
    │   │   }
    │   │
    │   ├─→ Cloudflare Worker receives request
    │   │   │
    │   │   ├─→ Builds OpenAI API request:
    │   │   │   - Model: gpt-4.1-mini
    │   │   │   - Input: [
    │   │   │       { type: "input_text", text: UNIVERSAL_PARSE_INSTRUCTIONS },
    │   │   │       { type: "input_text", text: "PAGE_NUMBER: 1" },
    │   │   │       { type: "input_text", text: "PAGE_TEXT:\n..." }
    │   │   │     ]
    │   │   │   - Format: json_object
    │   │   │
    │   │   ├─→ POST to OpenAI Responses API
    │   │   │   URL: https://api.openai.com/v1/responses
    │   │   │
    │   │   ├─→ OpenAI processes page text
    │   │   │   - Analyzes content
    │   │   │   - Extracts structured data
    │   │   │   - Returns Universal Fitness Schema JSON
    │   │   │
    │   │   └─→ Worker parses OpenAI response
    │   │       - Extracts JSON from output_text
    │   │       - Returns to backend
    │   │
    │   └─→ Backend receives partial plan JSON:
    │       {
    │         meta: { ... },
    │         profile: { ... },
    │         workouts: [ ... ],  // Only workouts from this page
    │         nutrition_plan: [ ... ],
    │         cardio_sessions: [ ... ],
    │         ...
    │         debug: {
    │           pages: [{
    │             page_number: 1,
    │             raw_text: "...",
    │             detected_elements: [],
    │             mapped_to: [],
    │             notes: "..."
    │           }]
    │         }
    │       }
    │
    └─→ (Repeat for each page - SEQUENTIALLY)
    ↓
Result: PageParseResponse[] = [partialPlan1, partialPlan2, ...]
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: DATA MERGING                                           │
└─────────────────────────────────────────────────────────────────┘

MergeService.mergePages(pageResults)
    ↓
- Creates empty UniversalFitnessPlan template
- For each page result:
    │
    ├─→ Arrays: Concatenate
    │   - workouts.push(...page.workouts)
    │   - nutrition_plan.push(...page.nutrition_plan)
    │   - cardio_sessions.push(...page.cardio_sessions)
    │   - mobility_and_rehab.push(...page.mobility_and_rehab)
    │   - stretching_routines.push(...page.stretching_routines)
    │   - education_and_guidelines.push(...page.education_and_guidelines)
    │   - unclassified.push(...page.unclassified)
    │
    ├─→ Objects: Merge (first non-empty wins)
    │   - meta: Fill empty fields
    │   - profile: Fill empty fields, concatenate arrays
    │   - assessment_and_background: Deep merge
    │   - food_sources: Shallow merge
    │
    └─→ Debug: Aggregate
        - debug.pages.push(...page.debug.pages)
    ↓
Result: Complete UniversalFitnessPlan
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: DATABASE STORAGE                                       │
└─────────────────────────────────────────────────────────────────┘

SQLite Database (ParsedPlan table)
    ↓
UPDATE ParsedPlan SET
    status = 'completed',
    rawJson = JSON.stringify(mergedResult),
    debugJson = JSON.stringify(debugJson),
    metaTitle = extractedTitle,
    metaCoachName = extractedCoachName,
    pagesCount = pageCount,
    updatedAt = now
WHERE id = planId
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: RESPONSE TO FRONTEND                                   │
└─────────────────────────────────────────────────────────────────┘

Backend → Frontend
    ↓
HTTP 200 Response:
{
  "status": "success",
  "planId": "c[timestamp][random]",
  "fitnessPlan": {
    // Complete UniversalFitnessPlan matching template
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
    "debug": { "pages": [ ... ] }
  },
  "logs": [
    "[timestamp] [PDFService] Splitting PDF into pages...",
    "[timestamp] [PDFService] Split into 5 pages",
    "[timestamp] [WorkerService] Sending pages to worker...",
    ...
  ]
}
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: FRONTEND PROCESSING                                    │
└─────────────────────────────────────────────────────────────────┘

Frontend (app/index.tsx)
    ↓
- Receives response
- Extracts fitnessPlan
- Displays logs in LogViewer
    ↓
- Saves to AsyncStorage:
  {
    id: planId,
    name: filename,
    timestamp: Date.now(),
    plan: fitnessPlan
  }
    ↓
- Navigates to FitnessPlanScreen
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 9: TEMPLATE MAPPING & DISPLAY                             │
└─────────────────────────────────────────────────────────────────┘

FitnessPlanScreen receives plan
    ↓
Maps fitnessPlan to empty template structure:
    │
    ├─→ Overview Tab:
    │   - meta.title → Display
    │   - profile.trainee_name → Display
    │   - profile.age, weight, height → Display
    │   - profile.goals → Display list
    │   - assessment_and_background → Display sections
    │
    ├─→ Workouts Tab:
    │   - workouts[] → WorkoutsSection component
    │   - Each workout: name, exercises[]
    │   - Each exercise: name, sets, reps, tempo, rest, notes
    │   - User can check off sets, add notes
    │
    ├─→ Nutrition Tab:
    │   - nutrition_plan[] → NutritionSection component
    │   - water_intake → Display
    │   - supplements[] → Display
    │   - food_sources → Display
    │
    ├─→ Cardio Tab:
    │   - cardio_sessions[] → GenericSection component
    │
    ├─→ Rehab Tab:
    │   - mobility_and_rehab[] → GenericSection
    │   - stretching_routines[] → GenericSection
    │
    ├─→ Supplements Tab:
    │   - supplements[] → GenericSection
    │
    ├─→ Education Tab:
    │   - education_and_guidelines[] → GenericSection
    │   - other_information[] → GenericSection
    │
    ├─→ Debug Tab:
    │   - debug.pages[] → DebugSection
    │   - Shows raw text, detected elements per page
    │
    └─→ JSON Tab:
        - Raw fitnessPlan JSON → JsonSection
    ↓
User can:
- View all parsed data
- Track progress (check exercises, log meals)
- Edit information
- Save changes (AsyncStorage)
```

---

## Key Points

### 1. **Template Matching**
- Worker returns Universal Fitness Schema JSON
- App template matches this schema exactly
- No transformation needed - direct mapping

### 2. **Empty States**
- If section has no data → Show "No [section] found" message
- Template structure always exists, even if empty

### 3. **Sequential Processing**
- Pages processed one-by-one (not parallel)
- Each page returns partial plan
- Backend merges all partial plans into one complete plan

### 4. **Error Handling**
- If page fails → Returns fallback with text in `unclassified[]`
- Processing continues with other pages
- Failed pages logged in `debug.pages[]`

### 5. **Data Persistence**
- Backend: SQLite database
- Frontend: AsyncStorage (device local storage)
- Both store complete `UniversalFitnessPlan` JSON

---

## Data Structures at Each Stage

### Stage 1: PDF Upload
```typescript
FormData {
  pdf: File {
    uri: string,
    name: string,
    type: "application/pdf",
    size: number
  }
}
```

### Stage 2: PDF Split
```typescript
PageData[] = [
  {
    pageNumber: 1,
    text: "extracted text...",
    imageBase64: null
  },
  ...
]
```

### Stage 3: Worker Request (Per Page)
```typescript
{
  page_number: 1,
  text: "extracted text...",
  image_base64: null
}
```

### Stage 4: Worker Response (Per Page)
```typescript
UniversalFitnessPlan (partial) = {
  meta: { ... },
  profile: { ... },
  workouts: [ /* only from this page */ ],
  nutrition_plan: [ /* only from this page */ ],
  ...
  debug: {
    pages: [{
      page_number: 1,
      raw_text: "...",
      detected_elements: [],
      mapped_to: [],
      notes: "..."
    }]
  }
}
```

### Stage 5: Merged Result
```typescript
UniversalFitnessPlan (complete) = {
  // All pages merged together
  meta: { ... },  // Merged from all pages
  profile: { ... },  // Merged from all pages
  workouts: [ /* all workouts from all pages */ ],
  nutrition_plan: [ /* all meals from all pages */ ],
  ...
  debug: {
    pages: [ /* all page debug info */ ]
  }
}
```

### Stage 6: Frontend Display
```typescript
// Same structure, displayed in UI components
FitnessPlanScreen receives: UniversalFitnessPlan
Maps to: UI Components (WorkoutsSection, NutritionSection, etc.)
```

---

## Performance Characteristics

- **Sequential Processing**: Pages processed one-by-one
  - Total time = sum of all page processing times
  - Could be optimized with parallel processing (future)

- **Timeout**: 60 seconds per page (worker call)

- **Database**: SQLite (file-based, local)

- **Storage**: 
  - Backend: SQLite
  - Frontend: AsyncStorage

---

## Error Scenarios

1. **PDF Upload Fails**
   - Multer validation error → 400 Bad Request
   - Frontend shows error message

2. **PDF Parsing Fails**
   - pdf-parse error → 500 Internal Server Error
   - Logs show error details

3. **Worker Call Fails**
   - Network error → Fallback object returned
   - Page text stored in `unclassified[]`
   - Processing continues with other pages

4. **OpenAI API Fails**
   - Worker returns error → Backend receives error
   - Page marked as failed in `debug.pages[]`
   - Processing continues

5. **Merge Fails**
   - MergeService error → 500 Internal Server Error
   - Logs show error details

---

## Summary

**The app's job is to:**
1. Accept PDF uploads
2. Send pages to AI parser (Worker)
3. Receive structured JSON
4. Display in trackable template
5. Allow user to track/edit data

**The Worker's job is to:**
1. Receive page text
2. Parse with OpenAI
3. Return structured JSON matching Universal Fitness Schema

**The template's job is to:**
1. Provide structure for all possible data
2. Display data when present
3. Show empty states when missing
4. Allow user interaction (tracking, editing)

