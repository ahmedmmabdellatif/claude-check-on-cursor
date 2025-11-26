// worker.service.ts - Cloudflare Worker proxy for chunked PDF parsing
// Sends PDF chunks (or full PDF) to the Cloudflare Worker
// Contract: { pdf_base64: string, filename?: string }

import axios from 'axios';
import { UniversalFitnessPlan } from '../types/fitnessPlan';
import { config } from '../config/env';

// Timeout constants
const CHUNK_TIMEOUT_MS = 120 * 1000; // 120 seconds per chunk
const FULL_PDF_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes for full PDF

export class WorkerService {
  private workerUrl: string;

  constructor(workerUrl?: string) {
    const url = workerUrl || process.env.PROCESSOR_URL || process.env.WORKER_URL || config.WORKER_URL || 'https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/';
    if (!url) {
      throw new Error("PROCESSOR_URL or WORKER_URL is not set. Please configure the Cloudflare Worker endpoint.");
    }
    this.workerUrl = url;
  }

  /**
   * Sends a PDF chunk (or full PDF) to the Cloudflare Worker.
   * Uses shorter timeout for chunks, longer for full PDFs.
   *
   * @param pdfBuffer - Raw PDF bytes (chunk or full PDF)
   * @param filename - Original filename (optional, used only for OpenAI context)
   * @param isChunk - Whether this is a chunk (uses shorter timeout)
   * @param pageRange - Page range string for logging (e.g., "1-5")
   */
  async parseFullPdf(
    pdfBuffer: Buffer,
    filename: string = "document.pdf",
    isChunk: boolean = true,
    pageRange?: string
  ): Promise<UniversalFitnessPlan> {
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new Error("Invalid pdfBuffer: expected a Buffer instance.");
    }

    // Convert raw bytes → base64
    const pdfBase64 = pdfBuffer.toString("base64");
    const timeout = isChunk ? CHUNK_TIMEOUT_MS : FULL_PDF_TIMEOUT_MS;
    const rangeLabel = pageRange || (isChunk ? 'chunk' : 'full PDF');

    console.log(`[WorkerService] Calling Worker for ${rangeLabel}, payload size (base64 length): ${pdfBase64.length}, timeout: ${timeout / 1000}s`);

    const payload = {
      pdf_base64: pdfBase64,
      filename
    };

    try {
      const response = await axios.post(this.workerUrl, payload, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: timeout, // axios timeout in milliseconds
      });

      console.log(`[WorkerService] Worker response for ${rangeLabel}, status: ${response.status}`);

      if (response.status !== 200) {
        const json = response.data;
        const errMsg =
          json?.error ||
          `Worker call failed with status ${response.status}: ${JSON.stringify(json)}`;

        const error = new Error(errMsg) as Error & { status?: number; workerBody?: any };
        error.status = response.status;
        error.workerBody = json;
        throw error;
      }

      const json = response.data;

      // Check if Worker returned an error in the JSON body
      if (json.error) {
        throw new Error(`Worker error: ${json.error}${json.details ? ` - ${json.details}` : ''}`);
      }

      return json as UniversalFitnessPlan;
    } catch (axiosError: any) {
      // Handle timeout
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout') || axiosError.message?.includes('aborted')) {
        console.error(`[WorkerService] Timeout calling Worker for ${rangeLabel} after ${timeout / 1000}s`);
        throw new Error(`Worker request timed out after ${timeout / 1000} seconds for ${rangeLabel}`);
      }

      // Handle axios errors (network errors, 502, etc.)
      if (axiosError.response) {
        // Worker returned an error response
        const status = axiosError.response.status;
        const json = axiosError.response.data || {};
        
        console.error(`[WorkerService] Error calling Worker for ${rangeLabel}, status: ${status}, body:`, JSON.stringify(json).substring(0, 200));

        const errMsg =
          json?.error ||
          `Worker call failed with status ${status}: ${JSON.stringify(json)}`;

        const error = new Error(errMsg) as Error & { status?: number; workerBody?: any };
        error.status = status;
        error.workerBody = json;
        throw error;
      } else if (axiosError.request) {
        // Request was made but no response received (timeout, network error)
        console.error(`[WorkerService] Error calling Worker for ${rangeLabel}:`, axiosError.message || 'No response from Worker');
        throw new Error(`Worker request failed: ${axiosError.message || 'No response from Worker'}`);
      } else {
        // Something else happened
        console.error(`[WorkerService] Error calling Worker for ${rangeLabel}:`, axiosError.message || 'Unknown error');
        throw new Error(`Worker service error: ${axiosError.message || 'Unknown error'}`);
      }
    }
  }
}

export const workerService = new WorkerService();
