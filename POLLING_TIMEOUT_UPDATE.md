# Frontend Polling Timeout Update

## Summary

Updated the frontend polling timeout from 15 minutes to 40 minutes to accommodate large PDFs (80+ pages) that require 20-30+ OpenAI API calls.

## Changes Made

### 1. Configuration Constants (`constants/pdfParserApi.ts`)

Added explicit configuration constants at the top of the file:

```typescript
// Polling configuration constants
// For very large PDFs with many chunks, 15 minutes is too short.
// Increase this to tolerate long-running background jobs.
const JOB_POLL_TIMEOUT_MS = 40 * 60 * 1000; // 40 minutes

// Poll interval can stay relatively small so progress updates remain responsive.
const JOB_POLL_INTERVAL_MS = 3000; // 3 seconds
```

### 2. Updated `pollJobStatus()` Function

- Changed default `maxPollTime` from `15 * 60 * 1000` to `JOB_POLL_TIMEOUT_MS` (40 minutes)
- Changed default `pollInterval` from `3000` to `JOB_POLL_INTERVAL_MS` (3 seconds)
- Improved error message to be clearer about client-side timeout vs backend failure
- Added `jobId` to error object for easier debugging

**New error message:**
```
Job polling timed out after 40 minutes. The backend may still be processing; please reopen the app later or retry to check the final result.
```

### 3. Updated Error Handling (`app/index.tsx`)

- Removed hardcoded timeout values from `pollJobStatus()` call (now uses defaults)
- Added logging of `jobId` when timeout error occurs for debugging

## Expected Behavior

### Before
- Frontend would timeout after 15 minutes
- Large PDFs (80+ pages) would fail even though backend was still processing
- Error: "Job polling timed out after 15 minutes"

### After
- Frontend will wait up to 40 minutes for job completion
- Large PDFs can complete successfully
- If timeout occurs, clearer message with jobId for debugging
- Error: "Job polling timed out after 40 minutes. The backend may still be processing; please reopen the app later or retry to check the final result."

## Testing

### Small PDF Test
- ✅ Should complete quickly (unchanged behavior)
- ✅ No impact from increased timeout

### Large PDF Test (87 pages)
- ✅ Should complete without timeout error
- ✅ Progress updates continue throughout
- ✅ Job reaches 100% completion

### Extreme Case
- If job takes > 40 minutes, user sees clear error message with jobId
- Backend may still be processing (job continues in background)
- User can retry later to check final result

## Notes

- **Backend unchanged**: No changes to job processing, timeouts, or status endpoints
- **Configurable**: Timeout can be easily adjusted by changing `JOB_POLL_TIMEOUT_MS`
- **Backward compatible**: Existing code using `pollJobStatus()` will automatically use new defaults

