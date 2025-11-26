# Async Chunked Processing Refactor (v5.5)

## Summary

Complete refactor from synchronous monolithic PDF parsing to **async chunked processing with polling**. This eliminates timeouts and allows large PDFs to be processed reliably.

## Architecture Changes

### Before (v5.4)
- Single synchronous request/response
- Full PDF sent to Worker in one request
- Frontend waits 15-20 minutes for response
- Timeouts on large PDFs
- Blocking request/response cycle

### After (v5.5)
- **Async job creation**: POST returns `jobId` immediately (202 Accepted)
- **Background processing**: PDF split into chunks, processed sequentially
- **Polling**: Frontend polls job status every 3 seconds
- **Progress tracking**: Real-time progress updates (pages/chunks processed)
- **No timeouts**: No long-running requests

## Backend Changes

### New Files

1. **`backend/src/db/job-schema.ts`**
   - ParseJob database schema
   - Job status: `pending` → `processing` → `done` / `error`
   - Tracks: `totalPages`, `processedPages`, `totalChunks`, `processedChunks`
   - Stores final `resultJson` when done

2. **`backend/src/services/pdfChunk.service.ts`**
   - Uses `pdf-lib` to split PDF into actual page-range chunks
   - Creates sub-PDFs (not just text extraction)
   - Returns `PdfChunk[]` with buffers for each chunk

3. **`backend/src/services/parseJob.service.ts`**
   - Background job processor
   - Splits PDF → processes chunks sequentially → merges results
   - Retry logic (2 retries with exponential backoff)
   - Updates job progress in database

### Modified Files

1. **`backend/src/controllers/parse.controller.ts`**
   - **POST `/api/parse`**: Creates job, returns `jobId` immediately
   - **GET `/api/parse/:jobId/status`**: Returns job status and progress
   - No blocking operations

2. **`backend/src/routes/parse.routes.ts`**
   - Added `GET /:jobId/status` route

3. **`backend/src/server.ts`**
   - Initializes `ParseJob` table on startup

## Frontend Changes

### Modified Files

1. **`constants/pdfParserApi.ts`**
   - `createParseJob()`: Uploads PDF, returns `jobId`
   - `pollJobStatus()`: Polls until done, with progress callbacks
   - Legacy `uploadAndParsePdf()` still works (uses new async flow internally)

2. **`app/index.tsx`**
   - `handleUpload()`: Creates job → polls status → updates UI
   - New state: `jobStatus`, `isPolling`
   - Progress updates via `pollJobStatus` callback

3. **`components/screens/UploadScreen.tsx`**
   - Shows real-time progress: pages/chunks processed, percentage
   - Displays polling status with activity indicator
   - Button disabled during polling

## API Contract

### POST `/api/parse`
**Request**: `multipart/form-data` with `pdf` field

**Response** (202 Accepted):
```json
{
  "jobId": "c123abc...",
  "status": "pending"
}
```

### GET `/api/parse/:jobId/status`
**Response** (200 OK):
```json
{
  "jobId": "c123abc...",
  "status": "processing",
  "progress": {
    "processedPages": 15,
    "totalPages": 50,
    "processedChunks": 3,
    "totalChunks": 10
  },
  "result": { ... },  // Only when status === "done"
  "error": "..."      // Only when status === "error"
}
```

## Processing Flow

1. **Upload**: Frontend POSTs PDF → Backend creates job → Returns `jobId`
2. **Background Processing**:
   - Split PDF into chunks (5 pages per chunk)
   - For each chunk:
     - Create sub-PDF with those pages
     - Send to Worker (one chunk at a time)
     - Adjust `debug.pages[].page_number` to match original PDF
     - Update job progress
   - Merge all chunk results
   - Save final result to job
3. **Polling**: Frontend polls every 3 seconds until `status === "done"`
4. **Completion**: Frontend receives `result` → Renders fitness plan

## Key Features

✅ **No timeouts**: No long-running requests  
✅ **Progress tracking**: Real-time pages/chunks progress  
✅ **Retry logic**: Failed chunks retry 2x with backoff  
✅ **Error handling**: Clear error messages, job status preserved  
✅ **Worker unchanged**: Worker still receives `{ pdf_base64, filename }` (one chunk at a time)  
✅ **Backward compatible**: Legacy API still works  

## Configuration

- **Pages per chunk**: `5` (configurable in `parse.controller.ts`)
- **Poll interval**: `3000ms` (3 seconds)
- **Max poll time**: `30 minutes`
- **Retry attempts**: `2` with exponential backoff

## Testing

1. **Small PDF (< 3 MB)**: Should process quickly, show progress
2. **Large PDF (> 3 MB)**: Should split into chunks, show progress for each chunk
3. **Network interruption**: Job continues in background, frontend can resume polling
4. **Error handling**: Failed chunks retry, job marked as error if all retries fail

## Migration Notes

- **No breaking changes**: Legacy `uploadAndParsePdf()` still works
- **Database**: New `ParseJob` table created automatically
- **Worker**: No changes required (still receives full PDF per request, but now it's a chunk)

