// parseJob.service.ts - Background job processor for chunked PDF parsing
// Processes PDF chunks with limited parallelism and merges results

import { workerService } from './worker.service';
import { pdfChunkService, PdfChunk } from './pdfChunk.service';
import { mergeService } from './merge.service';
import { normalizeParsedPlan } from './normalizePlan.service';
import { jobDb, ParseJob } from '../db/job-schema';
import { db } from '../db/sqlite-client';
import { UniversalFitnessPlan } from '../types/fitnessPlan';
import { downloadPdfFromR2 } from './r2Client';

// Global job timeout (40 minutes) - increased to allow large PDFs to complete
export const MAX_JOB_DURATION_MS = 40 * 60 * 1000; // 40 minutes

// How many chunks to process in parallel per job.
// Keep this low (2-3) to stay within OpenAI / Worker rate limits.
export const MAX_PARALLEL_CHUNKS = 2;

export class ParseJobService {
  /**
   * Processes a PDF from R2 by loading it, splitting into chunks, and processing chunks in parallel.
   * This is the main processing function.
   */
  async processPdfFromR2(
    jobId: string,
    r2Key: string,
    filename: string,
    pagesPerChunk: number = 5
  ): Promise<void> {
    const log = (message: string) => {
      console.log(`[ParseJobService] ${message}`);
    };

    try {
      // Update status to processing immediately (this sets startedAt)
      log(`Starting job ${jobId}`);
      jobDb.updateStatus(jobId, 'processing');
      
      // Get job to retrieve startedAt timestamp
      const job = jobDb.getById(jobId);
      if (!job || !job.startedAt) {
        throw new Error(`Job ${jobId} not found or startedAt not set`);
      }
      const jobStartTime = new Date(job.startedAt).getTime();

      // Step 1: Load PDF from R2
      log(`Job ${jobId}: Loading PDF from R2: ${r2Key}`);
      const pdfBuffer = await downloadPdfFromR2(r2Key);
      log(`Job ${jobId}: Loaded PDF from R2 (${pdfBuffer.length} bytes)`);

      // Step 2: Get total page count
      log(`Job ${jobId}: Getting page count...`);
      const totalPages = await pdfChunkService.getPageCount(pdfBuffer);
      log(`Job ${jobId}: PDF has ${totalPages} pages`);

      // Update job with total pages
      const totalChunks = Math.ceil(totalPages / pagesPerChunk);
      db.prepare('UPDATE ParseJob SET totalPages = ?, totalChunks = ? WHERE id = ?')
        .run(totalPages, totalChunks, jobId);

      log(`Job ${jobId}: Split PDF into ${totalPages} pages and ${totalChunks} chunks (${pagesPerChunk} pages per chunk)`);

      // Step 3: Split PDF into chunks
      log(`Job ${jobId}: Splitting PDF into chunks...`);
      const chunks = await pdfChunkService.splitPdfIntoChunks(pdfBuffer, pagesPerChunk);
      log(`Job ${jobId}: Created ${chunks.length} chunks`);

      // Step 4: Process chunks with limited parallelism
      const partialPlans: UniversalFitnessPlan[] = [];
      const chunkResults: Array<{ chunkIndex: number; plan: UniversalFitnessPlan | null; error: Error | null }> = [];
      
      // Initialize results array
      for (let i = 0; i < chunks.length; i++) {
        chunkResults.push({ chunkIndex: i, plan: null, error: null });
      }

      let nextChunkIndex = 0;
      let jobError: Error | null = null;

      // Worker function that processes chunks in parallel
      const worker = async () => {
        while (nextChunkIndex < chunks.length && !jobError) {
          // Check global timeout before starting a new chunk
          const elapsed = Date.now() - jobStartTime;
          if (elapsed > MAX_JOB_DURATION_MS) {
            const errorMsg = `Job exceeded max processing time (${MAX_JOB_DURATION_MS / 60000} minutes)`;
            log(`Job ${jobId}: ${errorMsg}`);
            jobError = new Error(errorMsg);
            jobDb.updateStatus(jobId, 'error', errorMsg);
            return;
          }

          const chunkIndex = nextChunkIndex++;
          const chunk = chunks[chunkIndex];
          const chunkNum = chunkIndex + 1;
          const pageRange = `${chunk.startPage}-${chunk.endPage}`;

          log(`Job ${jobId}: Processing chunk ${chunkNum}/${chunks.length} (pages ${pageRange})...`);

          try {
            const result = await this.processSingleChunk(
              jobId,
              chunk,
              chunkIndex,
              chunkNum,
              chunks.length,
              filename,
              pageRange,
              jobStartTime
            );

            chunkResults[chunkIndex] = { chunkIndex, plan: result, error: null };
            
            // Update progress (calculate from all completed chunks)
            const completedChunks = chunkResults.filter(r => r.plan !== null).length;
            let processedPages = 0;
            // Calculate total pages from all completed chunks
            for (let i = 0; i < chunks.length; i++) {
              if (chunkResults[i].plan !== null) {
                processedPages += (chunks[i].endPage - chunks[i].startPage + 1);
              }
            }
            jobDb.updateProgress(jobId, processedPages, completedChunks);

            log(`Job ${jobId}: Chunk ${chunkNum}/${chunks.length} completed successfully`);
          } catch (chunkError: any) {
            log(`Job ${jobId}: Chunk ${chunkNum}/${chunks.length} failed permanently: ${chunkError.message}`);
            chunkResults[chunkIndex] = { chunkIndex, plan: null, error: chunkError };
            
            // Mark job as error and stop processing
            const errorMsg = `Chunk ${chunkNum} (pages ${pageRange}) failed: ${chunkError.message}`;
            jobError = chunkError;
            jobDb.updateStatus(jobId, 'error', errorMsg);
            return;
          }
        }
      };

      // Start parallel workers
      const concurrency = Math.min(MAX_PARALLEL_CHUNKS, chunks.length);
      log(`Job ${jobId}: Starting ${concurrency} parallel workers to process ${chunks.length} chunks`);
      
      const workers: Promise<void>[] = [];
      for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
      }

      // Wait for all workers to complete
      await Promise.all(workers);

      // If job was marked as error, throw it
      if (jobError) {
        throw jobError;
      }

      // Collect all successful chunk results in order
      for (let i = 0; i < chunkResults.length; i++) {
        const result = chunkResults[i];
        if (result.plan) {
          partialPlans.push(result.plan);
        } else if (result.error) {
          // If any chunk failed, mark job as error
          const errorMsg = `Chunk ${i + 1} failed: ${result.error.message}`;
          log(`Job ${jobId}: ${errorMsg}`);
          jobDb.updateStatus(jobId, 'error', errorMsg);
          throw result.error;
        }
      }

      // Step 5: Merge all partial plans
      log(`Job ${jobId}: Merging all chunk results...`);
      const mergedPlan = mergeService.mergePageResults(partialPlans);

      // Sort debug.pages by page_number
      if (mergedPlan.debug?.pages) {
        mergedPlan.debug.pages.sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
      }

      log(`Job ${jobId}: Merge complete - total pages: ${mergedPlan.debug?.pages?.length || 0}`);

      // Step 6: Save raw result
      const resultJson = JSON.stringify(mergedPlan);
      jobDb.setResult(jobId, resultJson);

      // Step 7: Normalize plan for tracking UI
      log(`Job ${jobId}: Normalizing plan for tracking UI...`);
      try {
        const normalizedPlan = await normalizeParsedPlan(mergedPlan, filename);
        const normalizedJson = JSON.stringify(normalizedPlan);
        jobDb.setNormalized(jobId, normalizedJson);
        log(`Job ${jobId}: Normalization completed successfully`);
      } catch (normalizeError: any) {
        // Log error but don't fail the job - we still have the raw plan
        const errorMsg = normalizeError.message || 'Unknown normalization error';
        console.error(`[ParseJobService] Normalization failed for job ${jobId}:`, errorMsg);
        log(`Job ${jobId}: Normalization failed (raw plan still available): ${errorMsg}`);
        // Continue - the job is still successful with raw plan
      }

      const totalTime = ((Date.now() - jobStartTime) / 1000).toFixed(1);
      log(`Job ${jobId}: Completed. Status = done. Total pages: ${totalPages}, Time: ${totalTime}s`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      console.error(`[ParseJobService] Error processing job ${jobId}:`, errorMsg);
      console.error(`[ParseJobService] Error stack:`, error.stack);
      jobDb.updateStatus(jobId, 'error', errorMsg);
      throw error;
    }
  }

  /**
   * Processes a single chunk with retry logic.
   * This method handles all the per-chunk safety features (timeout, retries).
   */
  private async processSingleChunk(
    jobId: string,
    chunk: PdfChunk,
    chunkIndex: number,
    chunkNum: number,
    totalChunks: number,
    filename: string,
    pageRange: string,
    jobStartTime: number
  ): Promise<UniversalFitnessPlan> {
    const log = (message: string) => {
      console.log(`[ParseJobService] ${message}`);
    };

    const chunkFilename = `${filename} (chunk ${chunkNum})`;

    try {
      // Call Worker with this chunk (with timeout)
      const chunkPlan = await workerService.parseFullPdf(
        chunk.pdfBuffer,
        chunkFilename,
        true, // isChunk
        pageRange
      );

      // Adjust page numbers in debug.pages to match original PDF
      if (chunkPlan.debug?.pages) {
        chunkPlan.debug.pages = chunkPlan.debug.pages.map((page: any) => {
          const chunkPageNum = page.page_number || 1;
          const originalPageNum = chunk.startPage + chunkPageNum - 1;
          return {
            ...page,
            page_number: originalPageNum
          };
        });
      }

      return chunkPlan;
    } catch (chunkError: any) {
      log(`Job ${jobId}: Error while processing chunk ${chunkNum}/${totalChunks} (pages ${pageRange}): ${chunkError.message}`);
      
      // Retry logic (2 retries with exponential backoff)
      let retries = 2;
      let success = false;

      while (retries > 0 && !success) {
        // Check global timeout before retry
        const elapsed = Date.now() - jobStartTime;
        if (elapsed > MAX_JOB_DURATION_MS) {
          throw new Error(`Job exceeded max processing time (${MAX_JOB_DURATION_MS / 60000} minutes) while retrying chunk ${chunkNum}`);
        }

        const backoffMs = 2000 * (3 - retries); // 2s, 4s backoff
        log(`Job ${jobId}: Retrying chunk ${chunkNum}... (${retries} retries left, backoff: ${backoffMs}ms)`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));

        try {
          const chunkPlan = await workerService.parseFullPdf(
            chunk.pdfBuffer,
            chunkFilename,
            true,
            pageRange
          );

          if (chunkPlan.debug?.pages) {
            chunkPlan.debug.pages = chunkPlan.debug.pages.map((page: any) => {
              const chunkPageNum = page.page_number || 1;
              const originalPageNum = chunk.startPage + chunkPageNum - 1;
              return {
                ...page,
                page_number: originalPageNum
              };
            });
          }

          success = true;
          log(`Job ${jobId}: Chunk ${chunkNum} succeeded on retry`);
          return chunkPlan;
        } catch (retryError: any) {
          retries--;
          log(`Job ${jobId}: Retry failed for chunk ${chunkNum}, ${retries} retries left: ${retryError.message}`);
          if (retries === 0) {
            // All retries failed
            throw new Error(`Chunk ${chunkNum} (pages ${pageRange}) failed after retries: ${retryError.message}`);
          }
        }
      }

      // Should not reach here, but just in case
      throw chunkError;
    }
  }
}

export const parseJobService = new ParseJobService();
