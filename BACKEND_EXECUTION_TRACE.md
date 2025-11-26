# BACKEND EXECUTION TRACE: POST /api/parse
**Date:** 2025-11-25  
**Purpose:** Complete code-level trace of POST /api/parse execution path

---

## 2.1 ENTRY POINT

**File:** `backend/src/server.ts`  
**Line:** 35  
**Code:**
```typescript
app.use('/api/parse', parseRoutes);
```

**File:** `backend/src/routes/parse.routes.ts`  
**Line:** 24  
**Function:** `router.post('/', upload.single('pdf'), async (req, res, next) => { ... })`  
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

**File:** `backend/src/controllers/parse.controller.ts`  
**Line:** 24  
**Function:** `async parsePdf(req: Request, res: Response): Promise<void>`  
**Code:**
```typescript
async parsePdf(req: Request, res: Response): Promise<void> {
  try {
    // ... execution continues below
```

**FIRST EXECUTED LINE:** `backend/src/controllers/parse.controller.ts:25`

---

## 2.2 WORK DONE BEFORE RESPONSE

### Step 1: File Validation
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 26-29  
**Code:**
```typescript
if (!req.file) {
  res.status(400).json({ error: "Missing PDF file upload (field 'pdf')" });
  return;
}
```
**Action:** Validates PDF file exists in request  
**Blocking:** YES (returns immediately if missing)

### Step 2: Extract File Info
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 31-33  
**Code:**
```typescript
const filename = req.file.originalname || "document.pdf";
const pdfBuffer = req.file.buffer;
const fileSizeMb = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
```
**Action:** Reads entire PDF into memory (`req.file.buffer`)  
**Blocking:** YES (synchronous memory read)  
**Note:** PDF is already in memory from multer middleware (line 9 in parse.routes.ts: `multer.memoryStorage()`)

### Step 3: Generate Job ID
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 39-40  
**Code:**
```typescript
const jobId = generateId();
const now = new Date().toISOString();
```
**Action:** Generates unique job ID  
**Blocking:** YES (synchronous)

### Step 4: Generate R2 Key
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 42-43  
**Code:**
```typescript
const r2Key = `jobs/${jobId}/source.pdf`;
```
**Action:** Creates R2 storage key  
**Blocking:** YES (synchronous string operation)

### Step 5: Upload PDF to R2 (BLOCKING)
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 46-57  
**Code:**
```typescript
console.log(`[ParseController] ${jobId}: Uploading PDF to R2: ${r2Key}`);
try {
  await uploadPdfToR2(pdfBuffer, r2Key);
  console.log(`[ParseController] ${jobId}: Uploaded to R2: ${r2Key}`);
} catch (r2Error: any) {
  console.error(`[ParseController] ${jobId}: R2 upload failed:`, r2Error);
  const errorMessage = r2Error.message || 'Unknown error';
  res.status(500).json({
    error: `Failed to upload PDF to R2: ${errorMessage}`
  });
  return;
}
```

**File:** `backend/src/services/r2Client.ts`  
**Lines:** 24-41  
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

    await r2Client.send(command);  // ⚠️ BLOCKING NETWORK CALL
    console.log(`[R2Client] Uploaded PDF to R2: ${key} (${buffer.length} bytes)`);
    return key;
  } catch (error: any) {
    console.error(`[R2Client] Error uploading to R2:`, error);
    throw new Error(`Failed to upload PDF to R2: ${error.message || 'Unknown error'}`);
  }
}
```
**Action:** Uploads entire PDF buffer to R2 storage  
**Blocking:** YES (awaits network I/O)  
**Impact:** For large PDFs (50MB), this can take 5-10 seconds

### Step 6: Create Job Record in Database
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 59-76  
**Code:**
```typescript
const job = {
  id: jobId,
  status: 'pending' as const,
  createdAt: now,
  updatedAt: now,
  startedAt: null,
  sourceFilename: filename,
  r2Key,
  totalPages: 0,
  processedPages: 0,
  totalChunks: 0,
  processedChunks: 0,
  resultJson: null,
  error: null
};

jobDb.create(job);
```

**File:** `backend/src/db/job-schema.ts`  
**Lines:** 66-84  
**Code:**
```typescript
create(job: ParseJob): void {
  db.prepare(`
    INSERT INTO ParseJob (id, status, createdAt, updatedAt, startedAt, sourceFilename, r2Key, totalPages, processedPages, totalChunks, processedChunks, resultJson, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.status,
    // ... all fields
  );
}
```
**Action:** Inserts job record into SQLite database  
**Blocking:** YES (synchronous database write)

### Step 7: Start Background Processing (NON-BLOCKING)
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 83-88  
**Code:**
```typescript
parseJobService.processPdfFromR2(jobId, r2Key, filename, PAGES_PER_CHUNK)
  .catch((error: any) => {
    console.error(`[ParseController] ${jobId}: Background job failed:`, error);
    const errorMsg = error.message || 'Unknown error';
    jobDb.updateStatus(jobId, 'error', errorMsg);
  });
```
**Action:** Starts background job (fire-and-forget, no await)  
**Blocking:** NO (promise not awaited)

### Step 8: Send Response
**File:** `backend/src/controllers/parse.controller.ts`  
**Lines:** 90-103  
**Code:**
```typescript
const responseTime = Date.now() - requestStartTime;
console.log(`[ParseController] ${jobId}: Responding to client (job created) at ${new Date().toISOString()}, took ${responseTime}ms`);

res.status(202).json({
  jobId,
  status: 'pending',
  progress: {
    processedPages: 0,
    totalPages: 0,
    processedChunks: 0,
    totalChunks: 0
  }
});
```
**Action:** Sends HTTP 202 response with jobId  
**Blocking:** YES (sends response)

---

## 2.3 RESPONSE TIMING

**Exact Response Line:** `backend/src/controllers/parse.controller.ts:94`

**Response happens AFTER:**
- ✅ File validation (line 26)
- ✅ PDF read into memory (line 32) - **ALREADY IN MEMORY from multer**
- ✅ R2 upload completes (line 48) - **BLOCKING NETWORK CALL**
- ✅ Job record created in DB (line 76)
- ✅ Background job started (line 83) - **NON-BLOCKING**

**Response happens BEFORE:**
- ✅ PDF chunking
- ✅ Worker API calls
- ✅ OpenAI processing
- ✅ Result merging
- ✅ Any heavy CPU work

**Conclusion:** Response is sent immediately after R2 upload and job creation. Heavy work happens in background.

---

## 2.4 EXECUTION ORDER SUMMARY

```
Line 25:  parsePdf() function entry
Line 26:  Validate req.file exists
Line 31:  Extract filename
Line 32:  Read pdfBuffer from req.file.buffer (already in memory from multer)
Line 33:  Calculate fileSizeMb
Line 35:  Record requestStartTime
Line 36:  Log: "[ParseController] POST /api/parse received"
Line 39:  Generate jobId
Line 40:  Generate timestamp (now)
Line 43:  Generate r2Key = "jobs/{jobId}/source.pdf"
Line 46:  Log: "[ParseController] Uploading PDF to R2"
Line 48:  await uploadPdfToR2(pdfBuffer, r2Key)  ⚠️ BLOCKS HERE
  └─> r2Client.ts:34: await r2Client.send(command)  ⚠️ NETWORK I/O
Line 49:  Log: "[ParseController] Uploaded to R2"
Line 60:  Create job object
Line 76:  jobDb.create(job)  ⚠️ DATABASE WRITE
Line 78:  Log: "[ParseController] Created ParseJob"
Line 79:  Log: "[ParseController] Enqueuing job for background processing"
Line 83:  parseJobService.processPdfFromR2(...)  ✅ NON-BLOCKING (no await)
Line 92:  Calculate responseTime
Line 93:  Log: "[ParseController] Responding to client"
Line 94:  res.status(202).json({ jobId, status, progress })  ✅ RESPONSE SENT
Line 105: catch block (only if error occurs)
```

---

## 2.5 HEAVY WORK DETECTION

### Heavy Work BEFORE Response:

1. **R2 Upload (BLOCKING)**
   - **File:** `backend/src/services/r2Client.ts:34`
   - **Line:** 34
   - **Code:** `await r2Client.send(command);`
   - **What it does:** Uploads entire PDF buffer to Cloudflare R2 storage
   - **Impact:** For 50MB PDF, can take 5-10 seconds depending on network speed
   - **Blocking:** YES (awaited before response)

### Heavy Work AFTER Response (Background):

1. **PDF Download from R2**
   - **File:** `backend/src/services/parseJob.service.ts:48`
   - **Line:** 48
   - **Code:** `await downloadPdfFromR2(r2Key);`
   - **What it does:** Downloads PDF from R2 (happens in background)

2. **PDF Chunking**
   - **File:** `backend/src/services/parseJob.service.ts:65`
   - **Line:** 65
   - **Code:** `await pdfChunkService.splitPdfIntoChunks(pdfBuffer, pagesPerChunk);`
   - **What it does:** Splits PDF into chunks using pdf-lib

3. **Worker API Calls**
   - **File:** `backend/src/services/parseJob.service.ts:218`
   - **Line:** 218
   - **Code:** `await workerService.parseFullPdf(chunk.pdfBuffer, ...)`
   - **What it does:** Calls Cloudflare Worker for each chunk

4. **OpenAI Processing**
   - **File:** `cloudflare-worker.js:247`
   - **Line:** 247
   - **Code:** `await fetch("https://api.openai.com/v1/responses", ...)`
   - **What it does:** Sends PDF to OpenAI Responses API

5. **Result Merging**
   - **File:** `backend/src/services/parseJob.service.ts:172`
   - **Line:** 172
   - **Code:** `mergeService.mergePageResults(partialPlans)`
   - **What it does:** Merges all chunk results into one plan

**All of the above happen AFTER the 202 response is sent.**

---

## 2.6 LOG STATEMENTS (IN ORDER)

Based on current code, these logs fire during POST /api/parse:

```
1. [server.ts:21] Request logging middleware:
   "${new Date().toISOString()} - POST /api/parse"

2. [parse.controller.ts:36] 
   "[ParseController] ${filename}: POST /api/parse received at ${timestamp}, size: ${bytes} bytes (${fileSizeMb} MB)"

3. [parse.controller.ts:46]
   "[ParseController] ${jobId}: Uploading PDF to R2: ${r2Key}"

4. [r2Client.ts:35] (if upload succeeds)
   "[R2Client] Uploaded PDF to R2: ${key} (${buffer.length} bytes)"

5. [parse.controller.ts:49] (if upload succeeds)
   "[ParseController] ${jobId}: Uploaded to R2: ${r2Key}"

6. [parse.controller.ts:78]
   "[ParseController] ${jobId}: Created ParseJob with status: ${job.status}"

7. [parse.controller.ts:79]
   "[ParseController] ${jobId}: Enqueuing job for background processing"

8. [parse.controller.ts:93]
   "[ParseController] ${jobId}: Responding to client (job created) at ${timestamp}, took ${responseTime}ms"

--- BACKGROUND PROCESSING LOGS (after response) ---

9. [parseJob.service.ts:36] (background)
   "[ParseJobService] Starting job ${jobId}"

10. [parseJob.service.ts:47] (background)
    "[ParseJobService] Job ${jobId}: Loading PDF from R2: ${r2Key}"

11. [r2Client.ts:71] (background)
    "[R2Client] Downloaded PDF from R2: ${key} (${buffer.length} bytes)"

12. [parseJob.service.ts:49] (background)
    "[ParseJobService] Job ${jobId}: Loaded PDF from R2 (${bytes} bytes)"

13. [parseJob.service.ts:52] (background)
    "[ParseJobService] Job ${jobId}: Getting page count..."

14. [parseJob.service.ts:54] (background)
    "[ParseJobService] Job ${jobId}: PDF has ${totalPages} pages"

15. [parseJob.service.ts:61] (background)
    "[ParseJobService] Job ${jobId}: Split PDF into ${totalPages} pages and ${totalChunks} chunks"

16. [parseJob.service.ts:64] (background)
    "[ParseJobService] Job ${jobId}: Splitting PDF into chunks..."

17. [parseJob.service.ts:66] (background)
    "[ParseJobService] Job ${jobId}: Created ${chunks.length} chunks"

18. [parseJob.service.ts:141] (background)
    "[ParseJobService] Job ${jobId}: Starting ${concurrency} parallel workers to process ${chunks.length} chunks"

19. [parseJob.service.ts:98] (background, per chunk)
    "[ParseJobService] Job ${jobId}: Processing chunk ${chunkNum}/${totalChunks} (pages ${pageRange})..."

20. [worker.service.ts:48] (background, per chunk)
    "[WorkerService] Calling Worker for ${rangeLabel}, payload size (base64 length): ${pdfBase64.length}, timeout: ${timeout / 1000}s"

21. [worker.service.ts:63] (background, per chunk)
    "[WorkerService] Worker response for ${rangeLabel}, status: ${response.status}"

22. [parseJob.service.ts:125] (background, per chunk)
    "[ParseJobService] Job ${jobId}: Chunk ${chunkNum}/${totalChunks} completed successfully"

23. [parseJob.service.ts:171] (background)
    "[ParseJobService] Job ${jobId}: Merging all chunk results..."

24. [merge.service.ts:103] (background)
    "[Merge] Result counts: { workouts: X, meals: Y, ... }"

25. [parseJob.service.ts:179] (background)
    "[ParseJobService] Job ${jobId}: Merge complete - total pages: ${pages.length}"

26. [parseJob.service.ts:186] (background)
    "[ParseJobService] Job ${jobId}: Completed. Status = done. Total pages: ${totalPages}, Time: ${totalTime}s"
```

---

## SUMMARY

**Response Timing:** Response is sent at line 94, AFTER:
- File validation
- PDF read (already in memory from multer)
- **R2 upload (BLOCKING - can take 5-10s for large PDFs)**
- Job creation in DB

**Heavy Work:** All parsing, chunking, Worker calls, and OpenAI processing happen AFTER the response is sent (in background).

**Only Blocking Operation Before Response:** R2 upload (line 48).

