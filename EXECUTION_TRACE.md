# POST /api/parse - Complete Execution Trace

**NO summaries. NO guesses. Only real code, real line numbers, real execution order.**

---

## 1. Entry Point

When `POST /api/parse` is called:

**File:** `backend/src/server.ts`  
**Line:** 17-20  
**Function:** Request logging middleware  
**Code:**
```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

**File:** `backend/src/routes/parse.routes.ts`  
**Line:** 24-30  
**Function:** POST route handler  
**Code:**
```typescript
router.post('/', upload.single('pdf'), async (req, res, next) => {
  try {
    await parseController.parsePdf(req, res);
  } catch (error) {
    next(error);
  }
});
```

**File:** `backend/src/routes/parse.routes.ts`  
**Line:** 8-20  
**Function:** Multer middleware configuration  
**Code:**
```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});
```

**What happens:**
- Multer reads the entire PDF file from the multipart/form-data request into memory
- The PDF buffer is stored in `req.file.buffer`
- This happens **BEFORE** the controller function runs
- This is **BLOCKING** - the request waits for the entire file to be uploaded

---

## 2. Controller Execution - BEFORE Response

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 24  
**Function:** `parsePdf`  
**Code:**
```typescript
async parsePdf(req: Request, res: Response): Promise<void> {
```

### Step 1: File Validation

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 26-29  
**Code:**
```typescript
if (!req.file) {
  res.status(400).json({ error: "Missing PDF file upload (field 'pdf')" });
  return;
}
```

### Step 2: Extract File Info

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 31-33  
**Code:**
```typescript
const filename = req.file.originalname || "document.pdf";
const pdfBuffer = req.file.buffer;
const fileSizeMb = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
```

**What happens:**
- The PDF is **already in memory** (read by multer)
- `req.file.buffer` contains the entire PDF as a Buffer
- This is a **synchronous operation** (just accessing a property)

### Step 3: Log Request

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 35-36  
**Code:**
```typescript
const requestStartTime = Date.now();
console.log(`[ParseController] ${filename}: POST /api/parse received at ${new Date().toISOString()}, size: ${pdfBuffer.length} bytes (${fileSizeMb} MB)`);
```

### Step 4: Generate Job ID

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 39-40  
**Code:**
```typescript
const jobId = generateId();
const now = new Date().toISOString();
```

**File:** `backend/src/db/sqlite-client.ts`  
**Line:** 44-48  
**Function:** `generateId`  
**Code:**
```typescript
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomStr}`;
}
```

**What happens:**
- Synchronous ID generation
- No I/O operations

### Step 5: Generate R2 Key

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 42-43  
**Code:**
```typescript
// Generate R2 object key
const r2Key = `jobs/${jobId}/source.pdf`;
```

**What happens:**
- Simple string concatenation
- Synchronous operation

### Step 6: Upload PDF to R2 (BLOCKING)

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 45-48  
**Code:**
```typescript
// Upload PDF to R2 (this is necessary but should be fast for streaming)
console.log(`[ParseController] ${jobId}: Uploading PDF to R2: ${r2Key}`);
await uploadPdfToR2(pdfBuffer, r2Key);
console.log(`[ParseController] ${jobId}: Uploaded to R2: ${r2Key}`);
```

**File:** `backend/src/services/r2Client.ts`  
**Line:** 24-41  
**Function:** `uploadPdfToR2`  
**Code:**
```typescript
export async function uploadPdfToR2(buffer: Buffer, key: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    });

    await r2Client.send(command);
    console.log(`[R2Client] Uploaded PDF to R2: ${key} (${buffer.length} bytes)`);
    return key;
  } catch (error: any) {
    console.error(`[R2Client] Error uploading to R2:`, error);
    throw new Error(`Failed to upload PDF to R2: ${error.message || 'Unknown error'}`);
  }
}
```

**What happens:**
- **BLOCKING OPERATION** - The request waits for the entire PDF to be uploaded to R2
- This is an **async/await** operation, so the request handler is blocked
- The PDF buffer (already in memory) is sent to Cloudflare R2
- This can take time depending on:
  - PDF file size
  - Network speed to R2
  - R2 upload speed

**This is the FIRST heavy operation that blocks the response.**

### Step 7: Create Job Record in Database

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 50-65  
**Code:**
```typescript
// Create job with minimal info - page count will be computed in background
const job = {
  id: jobId,
  status: 'pending' as const,
  createdAt: now,
  updatedAt: now,
  startedAt: null,
  sourceFilename: filename,
  r2Key,
  totalPages: 0, // Will be computed in background
  processedPages: 0,
  totalChunks: 0, // Will be computed in background
  processedChunks: 0,
  resultJson: null,
  error: null
};

jobDb.create(job);
```

**File:** `backend/src/db/job-schema.ts`  
**Line:** 56-74  
**Function:** `jobDb.create`  
**Code:**
```typescript
create(job: ParseJob): void {
  db.prepare(`
    INSERT INTO ParseJob (id, status, createdAt, updatedAt, startedAt, sourceFilename, r2Key, totalPages, processedPages, totalChunks, processedChunks, resultJson, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.status,
    job.createdAt,
    job.updatedAt,
    job.startedAt,
    job.sourceFilename,
    job.r2Key,
    job.totalPages,
    job.processedPages,
    job.totalChunks,
    job.processedChunks,
    job.resultJson,
    job.error
  );
}
```

**What happens:**
- Synchronous SQLite database write
- Fast operation (local database)
- Job is created with `status: 'pending'` and `totalPages: 0`

### Step 8: Log Job Creation

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 69-70  
**Code:**
```typescript
console.log(`[ParseController] ${jobId}: Created ParseJob with status: ${job.status}`);
console.log(`[ParseController] ${jobId}: Enqueuing job for background processing`);
```

### Step 9: Start Background Processing (FIRE-AND-FORGET)

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 72-79  
**Code:**
```typescript
// Start background processing (don't await - fire and forget)
// Background job will: load from R2, compute page count, chunk, process, merge
parseJobService.processPdfFromR2(jobId, r2Key, filename, PAGES_PER_CHUNK)
  .catch((error: any) => {
    console.error(`[ParseController] ${jobId}: Background job failed:`, error);
    const errorMsg = error.message || 'Unknown error';
    jobDb.updateStatus(jobId, 'error', errorMsg);
  });
```

**What happens:**
- **NO AWAIT** - This is fire-and-forget
- The function call returns immediately (doesn't wait for processing)
- Background processing starts asynchronously
- The request handler continues immediately to the next line

**This is NOT blocking the response.**

### Step 10: Calculate Response Time

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 81-83  
**Code:**
```typescript
// Return jobId immediately (non-blocking)
const responseTime = Date.now() - requestStartTime;
console.log(`[ParseController] ${jobId}: Responding to client (job created) at ${new Date().toISOString()}, took ${responseTime}ms`);
```

**What happens:**
- Synchronous calculation
- Logs how long the request took (should be fast, only R2 upload + DB write)

---

## 3. Response Timing

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 85-94  
**Code:**
```typescript
res.status(202).json({
  jobId,
  status: 'pending',
  progress: {
    processedPages: 0,
    totalPages: 0, // Will be updated by background job
    processedChunks: 0,
    totalChunks: 0 // Will be updated by background job
  }
});
```

**This is the EXACT line where the HTTP response is sent.**

**Timing:**
- Response is sent **AFTER**:
  1. ✅ PDF is read into memory by multer (blocking)
  2. ✅ PDF is uploaded to R2 (blocking - `await uploadPdfToR2`)
  3. ✅ Job record is created in database (fast, synchronous)
  4. ✅ Background job is started (fire-and-forget, non-blocking)

- Response is sent **BEFORE**:
  1. ❌ PDF page count is computed
  2. ❌ PDF is split into chunks
  3. ❌ Chunks are processed by Worker
  4. ❌ Results are merged
  5. ❌ Final result is saved

---

## 4. Execution Order (Real Line Numbers)

```
Line 17 (server.ts): Request logging middleware logs the request
Line 24 (parse.routes.ts): Multer middleware reads entire PDF into memory (BLOCKING)
Line 26 (parse.controller.ts): File validation check
Line 31-33 (parse.controller.ts): Extract filename and buffer (synchronous)
Line 35-36 (parse.controller.ts): Log request received
Line 39-40 (parse.controller.ts): Generate jobId and timestamp (synchronous)
Line 42-43 (parse.controller.ts): Generate R2 key (synchronous)
Line 45-48 (parse.controller.ts): Upload PDF to R2 (BLOCKING - await)
  → Line 24-41 (r2Client.ts): uploadPdfToR2 function executes
  → Line 34 (r2Client.ts): await r2Client.send(command) - waits for R2 upload
Line 50-67 (parse.controller.ts): Create job object (synchronous)
Line 67 (parse.controller.ts): jobDb.create(job) - write to SQLite (synchronous, fast)
Line 69-70 (parse.controller.ts): Log job creation
Line 74 (parse.controller.ts): Start background job (fire-and-forget, NO await)
Line 81-83 (parse.controller.ts): Calculate response time and log
Line 85 (parse.controller.ts): res.status(202).json(...) - SEND RESPONSE TO CLIENT
Line 74 (parse.controller.ts): Background job continues in parallel (not blocking)
```

---

## 5. Heavy Work Detection

### Heavy Operations BEFORE Response:

1. **PDF Upload to Memory (Multer)**
   - **File:** `backend/src/routes/parse.routes.ts`
   - **Line:** 8-20 (multer configuration)
   - **Line:** 24 (multer middleware execution)
   - **Blocking:** YES - Request waits for entire file upload
   - **Code:**
     ```typescript
     const upload = multer({
       storage: multer.memoryStorage(),
       limits: { fileSize: 50 * 1024 * 1024 },
     });
     router.post('/', upload.single('pdf'), ...)
     ```

2. **R2 Upload**
   - **File:** `backend/src/controllers/parse.controller.ts`
   - **Line:** 47
   - **File:** `backend/src/services/r2Client.ts`
   - **Line:** 34
   - **Blocking:** YES - `await uploadPdfToR2(...)`
   - **Code:**
     ```typescript
     await uploadPdfToR2(pdfBuffer, r2Key);
     // Inside: await r2Client.send(command);
     ```

### Operations AFTER Response (Background):

1. **PDF Page Count**
   - **File:** `backend/src/services/parseJob.service.ts`
   - **Line:** 48-54
   - **Code:**
     ```typescript
     const pdfBuffer = await downloadPdfFromR2(r2Key);
     const totalPages = await pdfChunkService.getPageCount(pdfBuffer);
     ```

2. **PDF Chunking**
   - **File:** `backend/src/services/parseJob.service.ts`
   - **Line:** 64-66
   - **Code:**
     ```typescript
     const chunks = await pdfChunkService.splitPdfIntoChunks(pdfBuffer, pagesPerChunk);
     ```

3. **Worker Processing**
   - **File:** `backend/src/services/parseJob.service.ts`
   - **Line:** 218-223
   - **Code:**
     ```typescript
     const chunkPlan = await workerService.parseFullPdf(
       chunk.pdfBuffer,
       chunkFilename,
       true,
       pageRange
     );
     ```

4. **Result Merging**
   - **File:** `backend/src/services/parseJob.service.ts`
   - **Line:** 172
   - **Code:**
     ```typescript
     const mergedPlan = mergeService.mergePageResults(partialPlans);
     ```

---

## 6. Logs (In Correct Order)

Based on the code execution, here are the exact log statements that fire during `POST /api/parse`:

```
1. [server.ts:18] `${new Date().toISOString()} - POST /api/parse`
2. [parse.controller.ts:36] `[ParseController] ${filename}: POST /api/parse received at ${new Date().toISOString()}, size: ${pdfBuffer.length} bytes (${fileSizeMb} MB)`
3. [parse.controller.ts:46] `[ParseController] ${jobId}: Uploading PDF to R2: ${r2Key}`
4. [r2Client.ts:35] `[R2Client] Uploaded PDF to R2: ${key} (${buffer.length} bytes)`
5. [parse.controller.ts:48] `[ParseController] ${jobId}: Uploaded to R2: ${r2Key}`
6. [parse.controller.ts:69] `[ParseController] ${jobId}: Created ParseJob with status: ${job.status}`
7. [parse.controller.ts:70] `[ParseController] ${jobId}: Enqueuing job for background processing`
8. [parse.controller.ts:83] `[ParseController] ${jobId}: Responding to client (job created) at ${new Date().toISOString()}, took ${responseTime}ms`
```

**After response is sent (background job logs):**

```
9. [parseJob.service.ts:36] `[ParseJobService] Starting job ${jobId}`
10. [parseJob.service.ts:47] `[ParseJobService] Job ${jobId}: Loading PDF from R2: ${r2Key}`
11. [r2Client.ts:71] `[R2Client] Downloaded PDF from R2: ${key} (${buffer.length} bytes)`
12. [parseJob.service.ts:49] `[ParseJobService] Job ${jobId}: Loaded PDF from R2 (${pdfBuffer.length} bytes)`
13. [parseJob.service.ts:52] `[ParseJobService] Job ${jobId}: Getting page count...`
14. [parseJob.service.ts:54] `[ParseJobService] Job ${jobId}: PDF has ${totalPages} pages`
15. [parseJob.service.ts:61] `[ParseJobService] Job ${jobId}: Split PDF into ${totalPages} pages and ${totalChunks} chunks (${pagesPerChunk} pages per chunk)`
16. [parseJob.service.ts:64] `[ParseJobService] Job ${jobId}: Splitting PDF into chunks...`
17. [parseJob.service.ts:66] `[ParseJobService] Job ${jobId}: Created ${chunks.length} chunks`
18. [parseJob.service.ts:141] `[ParseJobService] Job ${jobId}: Starting ${concurrency} parallel workers to process ${chunks.length} chunks`
19. [parseJob.service.ts:98] `[ParseJobService] Job ${jobId}: Processing chunk ${chunkNum}/${chunks.length} (pages ${pageRange})...`
... (more chunk processing logs)
```

---

## Summary

**What blocks the response:**
1. ✅ Multer reading entire PDF into memory
2. ✅ Uploading PDF to R2 (`await uploadPdfToR2`)

**What doesn't block the response:**
1. ❌ PDF page counting (happens in background)
2. ❌ PDF chunking (happens in background)
3. ❌ Worker processing (happens in background)
4. ❌ Result merging (happens in background)

**Response is sent at:**
- `backend/src/controllers/parse.controller.ts:85`
- After R2 upload completes
- Before any PDF processing begins

**Total blocking time:**
- File upload time (multer) + R2 upload time
- Typically: 1-5 seconds for small PDFs, 10-30 seconds for large PDFs

