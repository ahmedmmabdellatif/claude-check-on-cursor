# Backend v5.4 - Chunked Fallback Implementation

## Summary

Implemented a **chunked parsing fallback** for large PDFs that cannot be processed by a single `gpt-4.1` full-PDF call due to TPM limits, while keeping the existing v5.3 full-PDF flow unchanged for small/medium PDFs.

## Architecture

### Decision Logic

**Size-based detection:**
- Threshold: `3 MB` (3,145,728 bytes)
- PDFs ≤ 3 MB → **Full-PDF mode** (Worker v5.3)
- PDFs > 3 MB → **Chunked mode** (Backend per-page processing)

**Error-based fallback:**
- If full-PDF mode returns 429 (token limit), automatically falls back to chunked mode
- Detects: `status === 429`, `rate_limit_exceeded`, `Request too large`, `tokens per min`

### Files Created/Modified

1. **`backend/src/services/chunkedParser.service.ts`** (NEW)
   - Extracts pages using `pdfService`
   - Calls OpenAI Responses API per page
   - Merges results using `mergeService`
   - Returns unified `UniversalFitnessPlan`

2. **`backend/src/controllers/parse.controller.ts`** (UPDATED)
   - Added size-based detection
   - Added 429 error fallback
   - Routes to chunked mode for large PDFs
   - Maintains same response contract

3. **`backend/src/config/env.ts`** (UPDATED)
   - Added `OPENAI_API_KEY` to config (optional, only needed for chunked mode)

4. **`backend/src/services/merge.service.ts`** (UPDATED)
   - Improved `debug.pages` merging to preserve page numbers

## Implementation Details

### Chunked Parser Service

**Per-page processing:**
- Uses `gpt-4.1-mini` model (cost-effective)
- `max_output_tokens: 3000` per page
- Calls OpenAI Responses API directly from backend
- Uses same `UNIVERSAL_PARSE_INSTRUCTIONS` adapted for per-page context

**Merging:**
- Concatenates all array fields (`workouts`, `nutrition_plan`, etc.)
- Merges objects (`meta`, `profile`, `food_sources`) using first non-empty strategy
- Preserves `debug.pages[]` with correct `page_number` values
- Sorts `debug.pages` by `page_number` ascending

**Error handling:**
- Fails fast: if any page fails, aborts entire operation
- Logs detailed error information
- Returns clear error messages with page context

### Controller Logic

```typescript
if (!isLargePdf) {
  // Try full-PDF mode
  try {
    parsed = await workerService.parseFullPdf(...);
  } catch (error) {
    if (isTokenLimitError) {
      // Fallback to chunked mode
      parsed = await chunkedParserService.parsePdfInChunks(...);
    } else {
      throw error;
    }
  }
} else {
  // Use chunked mode directly
  parsed = await chunkedParserService.parsePdfInChunks(...);
}
```

## Response Contract (Unchanged)

Frontend still receives:
```json
{
  "status": "success",
  "planId": "string",
  "fitnessPlan": UniversalFitnessPlan,
  "logs": ["string"]
}
```

- `fitnessPlan.debug.pages[]` contains all pages with correct `page_number`
- All sections (`workouts`, `nutrition_plan`, etc.) are merged and available
- Frontend code requires **no changes**

## Environment Variables

**Required for chunked mode:**
- `OPENAI_API_KEY` - Must be set in backend `.env` file

**Still required:**
- `PROCESSOR_URL` or `WORKER_URL` - For full-PDF mode
- `DATABASE_URL` - For persistence

## Testing Checklist

1. **Small PDF (< 3 MB)**
   - ✅ Uses full-PDF mode
   - ✅ Single Worker call
   - ✅ Returns complete plan

2. **Large PDF (> 3 MB)**
   - ✅ Uses chunked mode
   - ✅ Multiple OpenAI calls (one per page)
   - ✅ Returns merged plan with all pages

3. **429 Error Fallback**
   - ✅ Small PDF that hits 429 → falls back to chunked mode
   - ✅ Error is caught and handled gracefully

4. **Frontend Compatibility**
   - ✅ Same response shape
   - ✅ `debug.pages[]` works correctly
   - ✅ All sections accessible

## Logging

All operations are logged:
- `[ParseController] Large PDF detected...` or `Small PDF detected...`
- `[ChunkedParser] Starting chunked parsing...`
- `[ChunkedParser] Processing page X/Y...`
- `[ChunkedParser] Merge complete - total debug.pages: N`

## Notes

- Worker v5.3 remains **unchanged** - still accepts only `{ pdf_base64, filename }`
- Frontend remains **unchanged** - same API contract
- Chunked mode is **backend-only** - no Worker modifications
- PDF page extraction uses `pdf-parse` library (text-based, good enough for parsing)

