import { Request, Response } from 'express';
import { pdfService } from '../services/pdf.service';
import { workerService } from '../services/worker.service';
import { mergeService } from '../services/merge.service';
import { db, generateId } from '../db/sqlite-client';

export class ParseController {
  async parsePdf(req: Request, res: Response): Promise<void> {
    const totalStart = Date.now();
    const logs: string[] = [];

    // Helper to log to both console and array
    const log = (message: string) => {
      console.log(message);
      logs.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`);
    };

    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const fileBuffer = req.file.buffer;
      const filename = req.file.originalname;
      const fileSizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);

      log(`[ParseController] Received PDF: ${filename}, size: ${fileSizeMb} MB`);

      // Create initial database record
      const planId = generateId();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO ParsedPlan (id, createdAt, updatedAt, sourceFilename, pagesCount, status, rawJson, debugJson)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(planId, now, now, filename, 0, 'processing', '{}', '{}');

      try {
        // Step 1: Split PDF into pages
        log('[PDFService] Splitting PDF into pages...');
        const pages = await pdfService.splitPdf(fileBuffer);
        const pageCount = pages.length;
        log(`[PDFService] Split into ${pageCount} pages`);

        // Update page count
        db.prepare(`
          UPDATE ParsedPlan SET pagesCount = ?, updatedAt = ? WHERE id = ?
        `).run(pageCount, new Date().toISOString(), planId);

        // Step 2: Send each page to worker
        log('[WorkerService] Sending pages to worker...');

        const pageResults = await workerService.parseAllPages(pages);
        log(`[WorkerService] Received results for ${pageResults.length} pages`);

        // Step 3: Merge results
        log('[MergeService] Merging pages into global plan...');
        const mergedResult = mergeService.mergePageResults(pageResults);

        // Extract metadata for quick access
        const metaTitle = mergedResult.meta?.title || mergedResult.meta?.plan_name || 'Untitled Plan';
        const metaCoachName = mergedResult.meta?.coach_name || null;
        const metaDurationWeeks = mergedResult.meta?.duration_weeks || null;

        // Prepare debug JSON
        const debugJson = mergedResult.debug || { pages: [] };

        // Step 4: Save to database
        log(`[DB] Saving plan ${planId} to database...`);
        const updatedAt = new Date().toISOString();

        db.prepare(`
          UPDATE ParsedPlan
          SET status = ?, rawJson = ?, debugJson = ?, metaTitle = ?, metaCoachName = ?, metaDurationWeeks = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          'completed',
          JSON.stringify(mergedResult),
          JSON.stringify(debugJson),
          metaTitle,
          metaCoachName,
          metaDurationWeeks,
          updatedAt,
          planId
        );

        const totalEnd = Date.now();
        const totalDuration = totalEnd - totalStart;
        log(`[ParseController] Successfully completed parse for plan ${planId}`);
        log(`[ParseController] Total pages: ${pageCount}`);
        log(`[ParseController] TOTAL pipeline time: ${totalDuration} ms`);
        if (pageCount > 0) {
          log(`[ParseController] Avg per page: ${(totalDuration / pageCount).toFixed(2)} ms/page`);
        }
        log('[ParseController] WARNING: Pages processed sequentially. Consider parallelism.');

        // Return the friendly DTO
        res.status(200).json({
          status: 'success',
          planId,
          fitnessPlan: mergedResult,
          logs: logs // Return logs to frontend
        });

      } catch (error) {
        console.error('[ParseController] Error during processing:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`[ParseController] Error: ${errorMessage}`);

        db.prepare(`
          UPDATE ParsedPlan SET status = ?, updatedAt = ? WHERE id = ?
        `).run('failed', new Date().toISOString(), planId);

        res.status(500).json({
          error: 'Failed to process PDF',
          message: errorMessage,
          planId,
          logs: logs
        });
      }
    } catch (error) {
      console.error('[ParseController] Critical error:', error);
      // Try to return logs even on critical error
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown critical error',
        logs: logs
      });
    }
  }
}

export const parseController = new ParseController();
