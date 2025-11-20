import axios from 'axios';
import { UniversalFitnessPlan, PageParseResponse } from '../types/fitnessPlan';

const WORKER_URL = 'https://pdf-relay.ahmed-m-m-abdellatif.workers.dev/';

interface PageData {
  pageNumber: number;
  imageBase64: string | null;
  text: string;
}

export class WorkerService {
  async parsePageWithWorker(pageData: PageData): Promise<PageParseResponse> {
    const start = Date.now();
    try {
      console.log(`[Worker Service] Sending page ${pageData.pageNumber} to worker...`);

      const payload = {
        page_number: pageData.pageNumber,
        image_base64: pageData.imageBase64,
        text: pageData.text,
      };

      const response = await axios.post(WORKER_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60s timeout for worker
      });

      const end = Date.now();
      console.log(`[WorkerService] Page ${pageData.pageNumber} completed in ${end - start} ms`);

      if (response.status !== 200) {
        throw new Error(`Worker returned status ${response.status}`);
      }

      const data = response.data;

      // Basic validation to ensure it matches universal schema structure
      if (!data || typeof data !== 'object') {
        throw new Error('Worker returned invalid JSON');
      }

      return data as PageParseResponse;
    } catch (error) {
      const end = Date.now();
      console.error(`[Worker Service] Error parsing page ${pageData.pageNumber} after ${end - start} ms:`, error);

      // Return fallback error object
      return {
        unclassified: [pageData.text],
        debug: {
          pages: [{
            page_number: pageData.pageNumber,
            raw_text: pageData.text,
            notes: `FAILED TO PARSE: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        }
      };
    }
  }

  async parseAllPages(pages: PageData[]): Promise<PageParseResponse[]> {
    console.log(`[Worker Service] Processing ${pages.length} pages...`);

    const results: PageParseResponse[] = [];

    for (const page of pages) {
      const pageStart = Date.now();
      console.log(`[WorkerService] Starting page ${page.pageNumber} at ${new Date().toISOString()}`);
      const result = await this.parsePageWithWorker(page);
      results.push(result);
      console.log(`[WorkerService] Finished page ${page.pageNumber} (Total: ${Date.now() - pageStart} ms)`);
    }

    return results;
  }
}

export const workerService = new WorkerService();
