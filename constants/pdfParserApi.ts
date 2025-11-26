// pdfParserApi.ts
// Client helper for async PDF parsing with job polling

export interface DebugPage {
  page_number: number;
  raw_text: string;
  detected_elements?: any[];
  mapped_to?: any[];
  notes?: string;
}

export interface UniversalFitnessPlan {
  meta?: any;
  profile?: any;
  assessment_and_background?: any;
  warmup_protocols?: any[];
  mobility_and_rehab?: any[];
  stretching_routines?: any[];
  cardio_sessions?: any[];
  weekly_schedule?: any[];
  workouts?: any[];
  nutrition_plan?: any[];
  food_sources?: Record<string, any>;
  education_and_guidelines?: any[];
  other_information?: any[];
  unclassified?: any[];
  debug?: {
    pages: DebugPage[];
  };
  [key: string]: any;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: {
    processedPages: number;
    totalPages: number;
    processedChunks: number;
    totalChunks: number;
  };
  result?: UniversalFitnessPlan;
  normalizedPlan?: any; // ProgramForTracking - imported from shared schema
  error?: string;
}

export interface CreateJobResponse {
  jobId: string;
  status: 'pending';
  progress?: {
    processedPages: number;
    totalPages: number;
    processedChunks: number;
    totalChunks: number;
  };
}

// Use environment variable or default to your computer's IP address
export const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || "http://192.168.2.31:4000";

// Polling configuration constants
// For very large PDFs with many chunks, 15 minutes is too short.
// Increase this to tolerate long-running background jobs.
const JOB_POLL_TIMEOUT_MS = 40 * 60 * 1000; // 40 minutes

// Poll interval can stay relatively small so progress updates remain responsive.
const JOB_POLL_INTERVAL_MS = 3000; // 3 seconds

// Max time allowed for the initial file upload request.
// Increased to 20 minutes to handle large PDFs (80+ pages) on slow Wi-Fi connections.
// The backend uploads to R2 quickly, but the client-to-backend transfer can be slow for large files.
export const UPLOAD_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

// Status check timeout - should be quick
const STATUS_CHECK_TIMEOUT_MS = 30 * 1000; // 30 seconds for status checks

/**
 * Creates a fetch request with timeout.
 * Uses AbortController if available, otherwise falls back to Promise.race.
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  // Try to use AbortController (available in React Native 0.60+)
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    return fetch(url, {
      ...options,
      signal: controller.signal as any,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        return response;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          throw new Error(`Network request timed out after ${timeoutMs / 1000} seconds. The file may be too large or the server is slow. Please try again.`);
        }
        throw error;
      });
  }

  // Fallback: Use Promise.race (doesn't cancel the request, but provides timeout error)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Network request timed out after ${timeoutMs / 1000} seconds. The file may be too large or the server is slow. Please try again.`));
    }, timeoutMs);
  });

  const fetchPromise = fetch(url, options);

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Uploads a PDF and creates an async job.
 * Returns jobId immediately (non-blocking).
 */
export async function createParseJob(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<CreateJobResponse> {
  const formData = new FormData();

  // React Native FormData expects a file-like object with uri/name/type
  formData.append("pdf", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const uploadStartTime = Date.now();
  const fileSize = (file as any).size ? `${((file as any).size / (1024 * 1024)).toFixed(2)} MB` : 'unknown size';
  console.log('[createParseJob] Starting upload to /api/parse at', new Date().toISOString(), 'file:', file.name, 'size:', fileSize);

  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/parse`,
      {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually; let fetch add the multipart boundary.
      },
      UPLOAD_TIMEOUT_MS
    );

    const uploadDuration = Date.now() - uploadStartTime;
    console.log('[createParseJob] Upload completed at', new Date().toISOString(), 'status:', res.status, 'ok:', res.ok, `duration: ${uploadDuration}ms (${(uploadDuration / 1000).toFixed(1)}s)`);

    if (!res.ok) {
      let json;
      try {
        json = await res.json();
      } catch {
        const text = await res.text();
        throw new Error(`Failed to create job: ${text.substring(0, 200)}`);
      }
      throw new Error(json.error || `Failed to create job (status ${res.status})`);
    }

    const result = await res.json() as CreateJobResponse;
    const totalDuration = Date.now() - uploadStartTime;
    console.log('[createParseJob] Job created successfully, jobId:', result.jobId, `total duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
    return result;
  } catch (error: any) {
    const uploadDuration = Date.now() - uploadStartTime;
    console.log('[createParseJob] Upload failed at', new Date().toISOString(), `after ${uploadDuration}ms (${(uploadDuration / 1000).toFixed(1)}s)`, 'error:', error?.message || error);
    
    // Re-throw with better context
    if (error.message?.includes('timed out')) {
      const timeoutSeconds = Math.round(UPLOAD_TIMEOUT_MS / 1000);
      throw new Error(
        `Upload timeout: The file upload took too long (${timeoutSeconds}s limit). ` +
        `This may happen with a stalled connection. Please check your network and try again.`
      );
    }
    throw error;
  }
}

/**
 * Polls job status until completion or error.
 * 
 * @param jobId - Job ID from createParseJob
 * @param onProgress - Optional callback for progress updates
 * @param pollInterval - Polling interval in milliseconds (default: JOB_POLL_INTERVAL_MS)
 * @param maxPollTime - Maximum time to poll in milliseconds (default: JOB_POLL_TIMEOUT_MS)
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (status: JobStatus) => void,
  pollInterval: number = JOB_POLL_INTERVAL_MS,
  maxPollTime: number = JOB_POLL_TIMEOUT_MS
): Promise<UniversalFitnessPlan> {
  const startTime = Date.now();

  while (true) {
    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > maxPollTime) {
      const timeoutMinutes = Math.round(maxPollTime / 1000 / 60);
      const error: any = new Error(
        `Job polling timed out after ${timeoutMinutes} minutes. The backend may still be processing; please reopen the app later or retry to check the final result.`
      );
      error.jobId = jobId; // Include jobId for debugging
      throw error;
    }

    // Fetch job status with timeout
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${BASE_URL}/api/parse/${jobId}/status`,
        { method: 'GET' },
        STATUS_CHECK_TIMEOUT_MS
      );
    } catch (error: any) {
      // If status check times out, log but continue polling (don't fail the whole job)
      console.warn(`[pollJobStatus] Status check timed out, will retry on next poll:`, error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      continue;
    }
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Job not found');
      }
      const text = await res.text();
      throw new Error(`Failed to get job status: ${text.substring(0, 200)}`);
    }

    const status: JobStatus = await res.json();
    
    // Store normalized plan if available
    if (status.normalizedPlan && onProgress) {
      // Call progress with normalized plan included
      onProgress({ ...status, normalizedPlan: status.normalizedPlan });
    }

    // Call progress callback
    if (onProgress) {
      onProgress(status);
    }

    // Check if done
    if (status.status === 'done') {
      if (!status.result) {
        throw new Error('Job completed but no result available');
      }
      return status.result;
    }

    // Check if error
    if (status.status === 'error') {
      throw new Error(status.error || 'Job failed with unknown error');
    }

    // Still processing - wait and poll again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

// Legacy function for backward compatibility (not used in new flow)
export interface ParseResponse {
  status: 'success' | 'failed';
  planId?: string;
  fitnessPlan?: UniversalFitnessPlan;
  logs?: string[];
  error?: string;
  message?: string;
  workerBody?: any;
}

export async function uploadAndParsePdf(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<ParseResponse> {
  // This is the old synchronous API - now redirects to async job flow
  try {
    const { jobId } = await createParseJob(file);
    
    // Poll until done
    const fitnessPlan = await pollJobStatus(jobId);
    
    return {
      status: 'success',
      fitnessPlan,
      planId: jobId
    };
  } catch (error: any) {
    return {
      status: 'failed',
      error: error.message || 'Unknown error'
    };
  }
}
