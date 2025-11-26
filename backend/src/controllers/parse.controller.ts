// parse.controller.ts - Express controller for async chunked PDF parsing (v5.5)
//
// Responsibilities:
//   - Accept PDF upload and create async job
//   - Return jobId immediately (non-blocking)
//   - Provide job status endpoint for polling
//   - Process PDFs in chunks in background

import { Request, Response } from "express";
import { parseJobService } from "../services/parseJob.service";
import { pdfChunkService } from "../services/pdfChunk.service";
import { jobDb } from "../db/job-schema";
import { generateId } from "../db/sqlite-client";
import { uploadPdfToR2 } from "../services/r2Client";

// Pages per chunk (configurable) - reduced for better performance
const PAGES_PER_CHUNK = 3;

export class ParseController {
  /**
   * POST /api/parse
   * Creates an async job and returns jobId immediately.
   */
  async parsePdf(req: Request, res: Response): Promise<void> {
    const requestStartTime = Date.now();
    const requestTimestamp = new Date().toISOString();
    
    console.log(`[ParseController] Incoming /api/parse at ${requestTimestamp}, method: ${req.method}`);
    
    try {
      if (!req.file) {
        console.log(`[ParseController] Missing PDF file upload (field 'pdf') at ${new Date().toISOString()}`);
        res.status(400).json({ error: "Missing PDF file upload (field 'pdf')" });
        return;
      }

      const filename = req.file.originalname || "document.pdf";
      const pdfBuffer = req.file.buffer;
      const fileSizeMb = (pdfBuffer.length / (1024 * 1024)).toFixed(2);

      console.log(`[ParseController] Start reading file/multipart at ${new Date().toISOString()}, filename: ${filename}, size: ${pdfBuffer.length} bytes (${fileSizeMb} MB)`);

      // Create job FIRST (before any heavy work)
      const jobId = generateId();
      const now = new Date().toISOString();
      
      // Generate R2 object key
      const r2Key = `jobs/${jobId}/source.pdf`;

      // Upload PDF to R2 (this is necessary but should be fast for streaming)
      const r2UploadStartTime = Date.now();
      console.log(`[ParseController] ${jobId}: Uploading PDF to R2: ${r2Key} at ${new Date().toISOString()}`);
      try {
        await uploadPdfToR2(pdfBuffer, r2Key);
        const r2UploadDuration = Date.now() - r2UploadStartTime;
        console.log(`[ParseController] ${jobId}: Uploaded to R2: ${r2Key} at ${new Date().toISOString()}, took ${r2UploadDuration}ms (${(r2UploadDuration / 1000).toFixed(1)}s)`);
      } catch (r2Error: any) {
        console.error(`[ParseController] ${jobId}: R2 upload failed:`, r2Error);
        const errorMessage = r2Error.message || 'Unknown error';
        res.status(500).json({
          error: `Failed to upload PDF to R2: ${errorMessage}`
        });
        return;
      }

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

      console.log(`[ParseController] ${jobId}: Created ParseJob with status: ${job.status}`);
      console.log(`[ParseController] ${jobId}: Enqueuing job for background processing`);

      // Start background processing (don't await - fire and forget)
      // Background job will: load from R2, compute page count, chunk, process, merge
      parseJobService.processPdfFromR2(jobId, r2Key, filename, PAGES_PER_CHUNK)
        .catch((error: any) => {
          console.error(`[ParseController] ${jobId}: Background job failed:`, error);
          const errorMsg = error.message || 'Unknown error';
          jobDb.updateStatus(jobId, 'error', errorMsg);
        });

      // Return jobId immediately (non-blocking)
      const responseTime = Date.now() - requestStartTime;
      const responseTimestamp = new Date().toISOString();
      console.log(`[ParseController] Responding to client with jobId=${jobId} at ${responseTimestamp}, total request time: ${responseTime}ms (${(responseTime / 1000).toFixed(1)}s)`);
      
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

    } catch (error: any) {
      console.error('[ParseController] Error creating job:', error);
      res.status(500).json({
        error: error.message || 'Failed to create parse job'
      });
    }
  }

  /**
   * GET /api/parse/:jobId/status
   * Returns job status and result when done.
   */
  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({ error: 'Missing jobId parameter' });
        return;
      }

      const job = jobDb.getById(jobId);

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      // Build response
      const response: any = {
        jobId: job.id,
        status: job.status,
        progress: {
          processedPages: job.processedPages,
          totalPages: job.totalPages,
          processedChunks: job.processedChunks,
          totalChunks: job.totalChunks
        }
      };

      // Include result if done
      if (job.status === 'done' && job.resultJson) {
        try {
          response.result = JSON.parse(job.resultJson);
        } catch (e) {
          console.error(`[ParseController] Error parsing result JSON for job ${jobId}:`, e);
          response.error = 'Failed to parse result JSON';
        }
      }

      // Include normalized plan if available (preferred for UI)
      if (job.status === 'done' && job.normalizedJson) {
        try {
          response.normalizedPlan = JSON.parse(job.normalizedJson);
        } catch (e) {
          console.error(`[ParseController] Error parsing normalized JSON for job ${jobId}:`, e);
          // Don't fail - normalized plan is optional
        }
      }

      // Include error if failed
      if (job.status === 'error' && job.error) {
        response.error = job.error;
      }

      res.status(200).json(response);

    } catch (error: any) {
      console.error('[ParseController] Error getting job status:', error);
      res.status(500).json({
        error: error.message || 'Failed to get job status'
      });
    }
  }
}

export const parseController = new ParseController();
