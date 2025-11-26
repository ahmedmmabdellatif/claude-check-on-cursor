# Parallel Chunk Processing & Extended Timeout

## Summary

Updated the backend to:
1. **Increase max job duration** from 15 minutes to 40 minutes
2. **Add parallel chunk processing** (2 chunks at a time) to improve performance
3. **Maintain all safety features** (per-chunk timeout, retries, error handling)

## Changes Made

### 1. Extended Job Timeout (`backend/src/services/parseJob.service.ts`)

**Before:**
```typescript
const MAX_JOB_DURATION_MS = 15 * 60 * 1000; // 15 minutes
```

**After:**
```typescript
export const MAX_JOB_DURATION_MS = 40 * 60 * 1000; // 40 minutes
```

- Exported constant for potential reuse
- Increased to 40 minutes to match frontend polling timeout
- All timeout checks now use this constant (no hardcoded values)

### 2. Parallel Chunk Processing

**Added:**
```typescript
export const MAX_PARALLEL_CHUNKS = 2;
```

**Architecture:**
- **Before**: Sequential processing (1 chunk at a time)
- **After**: Parallel processing (2 chunks at a time)

**Implementation:**
- Worker pattern with `MAX_PARALLEL_CHUNKS` concurrent workers
- Each worker picks the next available chunk index
- Results stored in array indexed by chunk position
- Final merge collects results in order

**Benefits:**
- ~2x faster processing for large PDFs
- 87-page PDF: ~15-20 minutes → ~8-12 minutes (estimated)
- Still respects rate limits (only 2 parallel requests)

### 3. Thread-Safe Progress Updates

**Solution:**
- Each chunk result stored in `chunkResults[chunkIndex]`
- Progress calculated from completed chunks
- Database updates happen after each chunk completes
- No race conditions (Node.js single-threaded event loop)

### 4. Preserved Safety Features

All existing safety features remain intact:

✅ **Per-chunk timeout**: 120 seconds per chunk (unchanged)
✅ **Retry logic**: 2 retries with exponential backoff (unchanged)
✅ **Error handling**: Clear error messages with chunk context (unchanged)
✅ **Global timeout check**: Before starting each chunk and before retries

## Expected Performance

### Before (Sequential)
- 87 pages / 29 chunks
- ~30-40 seconds per chunk
- **Total: ~15-20 minutes**

### After (Parallel, 2 chunks)
- 87 pages / 29 chunks
- ~30-40 seconds per chunk
- **Total: ~8-12 minutes** (approximately 2x faster)

## Error Messages

All error messages now derive from constants:

```typescript
`Job exceeded max processing time (${MAX_JOB_DURATION_MS / 60000} minutes)`
// Shows: "Job exceeded max processing time (40 minutes)"
```

## Testing Checklist

- [x] Small PDF: Should complete quickly (unchanged)
- [ ] Large 87-page PDF: Should complete in ~8-12 minutes
- [ ] Parallel processing: Logs should show chunks processing simultaneously
- [ ] Progress updates: Should show correct page/chunk counts
- [ ] Error handling: Failed chunks should retry and mark job as error if all retries fail
- [ ] Timeout: Job should not be killed prematurely (40-minute limit)

## Code Structure

### Main Processing Flow
1. Split PDF into chunks
2. Start `MAX_PARALLEL_CHUNKS` workers
3. Each worker processes chunks sequentially (picks next available)
4. Collect results in order
5. Merge all results
6. Save final plan

### Per-Chunk Processing (`processSingleChunk`)
- Calls Worker with timeout
- Adjusts page numbers
- Retries on failure (2 retries with backoff)
- Returns plan or throws error

## Notes

- **Backend only**: No changes to Worker or frontend (except error messages will show 40 minutes)
- **Configurable**: `MAX_JOB_DURATION_MS` and `MAX_PARALLEL_CHUNKS` can be easily adjusted
- **Safe**: All existing safety features preserved
- **Scalable**: Can increase `MAX_PARALLEL_CHUNKS` to 3-4 if needed (watch rate limits)

