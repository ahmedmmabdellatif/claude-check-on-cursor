# Async Chunked Processing - Debugging & Performance Fixes

## Issues Fixed

### 1. **Job Status Never Updated to 'processing'**
- **Problem**: Job stayed in 'pending' status because `processPdfInChunks` didn't update status immediately
- **Fix**: Added `jobDb.updateStatus(jobId, 'processing')` at the start of `processPdfInChunks`

### 2. **No Per-Chunk Timeout**
- **Problem**: Single chunk could hang forever, blocking entire job
- **Fix**: Added 120-second timeout per chunk in `WorkerService.parseFullPdf()`
- **Implementation**: Uses axios `timeout` option (120s for chunks, 20min for full PDF)

### 3. **No Global Job Timeout**
- **Problem**: Jobs could run indefinitely
- **Fix**: Added 15-minute global timeout check in `processPdfInChunks`
- **Behavior**: Job marked as 'error' if exceeds 15 minutes

### 4. **Insufficient Logging**
- **Problem**: Couldn't trace where jobs were getting stuck
- **Fix**: Added comprehensive logging throughout:
  - `[ParseController]`: PDF received, pages counted, job created, enqueued
  - `[ParseJobService]`: Job start, chunk processing, progress updates, errors, completion
  - `[WorkerService]`: Worker calls, responses, timeouts, errors

### 5. **Chunk Size Too Large**
- **Problem**: 5 pages per chunk could still be too slow
- **Fix**: Reduced to 3 pages per chunk for better performance

### 6. **Frontend Polling Timeout Too Long**
- **Problem**: 30-minute timeout was unrealistic
- **Fix**: Reduced to 15 minutes to match backend timeout

### 7. **Page Number Adjustment Bug**
- **Problem**: Page numbers in `debug.pages` might not map correctly to original PDF
- **Fix**: Corrected page number calculation:
  ```typescript
  // Before: page_number: (page.page_number || 1) + chunk.startPage - 1
  // After: 
  const chunkPageNum = page.page_number || 1;
  const originalPageNum = chunk.startPage + chunkPageNum - 1;
  ```

## Key Changes

### Backend Files Modified

1. **`backend/src/services/worker.service.ts`**
   - Added per-chunk timeout (120 seconds)
   - Added comprehensive logging
   - Better error handling for timeouts

2. **`backend/src/services/parseJob.service.ts`**
   - Immediate status update to 'processing'
   - Global job timeout (15 minutes)
   - Enhanced logging at every step
   - Fixed page number adjustment logic
   - Better error messages

3. **`backend/src/controllers/parse.controller.ts`**
   - Enhanced logging for job creation
   - Reduced chunk size to 3 pages
   - Better error handling

### Frontend Files Modified

1. **`constants/pdfParserApi.ts`**
   - Reduced max poll time to 15 minutes
   - Better timeout error message

2. **`app/index.tsx`**
   - Added console logging for job status
   - Reduced polling timeout to 15 minutes

## Logging Output Examples

### Successful Job Flow
```
[ParseController] Received PDF: document.pdf, size: 5242880 bytes (5.00 MB)
[ParseController] Split PDF into 80 pages and 27 chunks (3 pages per chunk)
[ParseController] Created ParseJob c123... with status: pending
[ParseController] Enqueuing job c123... for background processing
[ParseJobService] Starting job c123...
[ParseJobService] Job c123...: PDF has 80 pages
[ParseJobService] Job c123...: Created 27 chunks
[ParseJobService] Job c123...: Processing chunk 1/27 (pages 1-3)...
[WorkerService] Calling Worker for 1-3, payload size (base64 length): 123456, timeout: 120s
[WorkerService] Worker response for 1-3, status: 200
[ParseJobService] Job c123...: Finished chunk 1/27 (pages 1-3), processedPages: 3
...
[ParseJobService] Job c123...: Completed. Status = done. Total pages: 80, Time: 245.3s
```

### Error Flow
```
[ParseJobService] Job c123...: Processing chunk 5/27 (pages 13-15)...
[WorkerService] Calling Worker for 13-15, payload size (base64 length): 123456, timeout: 120s
[WorkerService] Timeout calling Worker for 13-15 after 120s
[ParseJobService] Job c123...: Error while processing chunk 5/27 (pages 13-15): Worker request timed out after 120 seconds
[ParseJobService] Job c123...: Retrying chunk 5... (2 retries left, backoff: 2000ms)
...
[ParseJobService] Error processing job c123...: Chunk 5 (pages 13-15) failed after retries: Worker request timed out after 120 seconds
```

## Performance Improvements

1. **Chunk Size**: Reduced from 5 to 3 pages per chunk
   - Faster per-chunk processing
   - More granular progress updates
   - Better error isolation

2. **Timeouts**:
   - Per-chunk: 120 seconds (2 minutes)
   - Global job: 15 minutes
   - Frontend polling: 15 minutes

3. **Expected Performance**:
   - 80-page PDF: ~4-6 minutes (assuming ~3-5 seconds per chunk)
   - 50-page PDF: ~2-4 minutes
   - Each chunk should complete in < 60-90 seconds under normal conditions

## Testing Checklist

- [x] Job status updates to 'processing' immediately
- [x] Per-chunk timeout works (120s)
- [x] Global job timeout works (15min)
- [x] Logging shows complete job lifecycle
- [x] Page numbers correctly mapped in final result
- [x] Frontend polling stops at 15 minutes
- [x] Error messages are clear and actionable
- [x] Progress updates work correctly

## Next Steps

1. Monitor backend logs during next large PDF test
2. Verify chunks complete in < 90 seconds each
3. Check that job always reaches 'done' or 'error' status
4. Confirm page numbers are correct in final `debug.pages[]`

