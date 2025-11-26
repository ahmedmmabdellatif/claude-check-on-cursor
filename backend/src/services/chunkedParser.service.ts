// chunkedParser.service.ts - Backend-only chunked PDF parser for large PDFs
//
// This service handles large PDFs that exceed TPM limits by:
// 1. Extracting pages from the PDF
// 2. Calling OpenAI Responses API per page
// 3. Merging all partial results into one UniversalFitnessPlan
//
// This is a fallback for large PDFs only. Small PDFs still use Worker v5.3.

import axios from 'axios';
import { pdfService, PdfPage } from './pdf.service';
import { mergeService } from './merge.service';
import { UniversalFitnessPlan } from '../types/fitnessPlan';

// Reuse the same instructions from Worker v5.3, adapted for per-page processing
const UNIVERSAL_PARSE_INSTRUCTIONS = `
You are an expert document analyst specialized in fitness, training, rehabilitation, nutrition, and health documents.

YOU ARE PROCESSING EXACTLY ONE PAGE OF A LARGER PDF.

YOUR PRIMARY GOALS:
1. Parse THIS PAGE fully. No skipping.
2. Do NOT summarize any structured data.
3. Only motivational content may be summarized lightly.
4. If schema has no place → store the content in "unclassified".
5. If the page contains only images → describe them in detail.
6. Extract ALL text, ALL bullet points, ALL tables, ALL instructions that appear on THIS PAGE.
7. This page must appear in debug.pages[].
8. Repeated content must stay repeated.
9. Do not hallucinate missing values.
10. JSON must always follow the schema EXACTLY.

UNIVERSAL FITNESS JSON SCHEMA (EXTREMELY WIDE):

{
  "meta": {
    "title": "",
    "subtitle": "",
    "author": "",
    "creation_date": "",
    "source": ""
  },

  "profile": {
    "trainee_name": "",
    "age": "",
    "gender": "",
    "height_cm": "",
    "weight_kg": "",
    "location": "",
    "goals": [],
    "notes": []
  },

  "assessment_and_background": {
    "demographics": {},
    "health_status": {
      "medical_conditions": [],
      "injuries": [],
      "pain_points": [],
      "posture_issues": [],
      "mobility_limitations": [],
      "rehab_history": []
    },
    "fitness_status": {
      "experience_level": "",
      "training_history": "",
      "weak_points": [],
      "strong_points": []
    },
    "monitoring_and_tracking": {
      "body_measurements": [],
      "weekly_metrics": [],
      "progress_evaluation": []
    },
    "behavior_and_psychology": {
      "motivation_notes": [],
      "adherence_notes": [],
      "mindset_notes": []
    }
  },

  "warmup_protocols": [],
  "mobility_and_rehab": [],
  "stretching_routines": [],
  "cardio_sessions": [],
  "weekly_schedule": [],
  "workouts": [],
  "nutrition_plan": [],
  "food_sources": {},
  "education_and_guidelines": [],
  "other_information": [],
  "unclassified": [],

  "debug": {
    "pages": []
  }
}

PAGE-BY-PAGE DEBUG FORMAT (FOR THIS PAGE ONLY):

In debug.pages[] include exactly one entry for this page:

{
  "page_number": <page_number>,
  "raw_text": "<extract ALL text from this page exactly>",
  "detected_elements": [],
  "mapped_to": [],
  "notes": "Short classification only for this page"
}

CONTENT HANDLING (LIMITED TO THIS PAGE):

Exercises:
- name, sets, reps, tempo, rest, equipment, muscles, instructions, media links

Mobility/Rehab:
- target area, purpose, steps, frequency, variations

Cardio:
- type, duration, intensity, frequency, heart rate, weekly progression

Nutrition:
- meals, options, ingredients, gram amounts, notes, restrictions

Food Sources:
- classify proteins, carbs, fats, fruits, salads, vegetables, drinks, supplements

Education:
- full long text extraction

Unknown content:
- push into unclassified EXACTLY as-is

FINAL OUTPUT FOR THIS PAGE:
Return ONE JSON object following the schema above, containing ONLY information from this page. No text outside JSON.
`;

export class ChunkedParserService {
  private openaiApiKey: string;
  private openaiUrl = 'https://api.openai.com/v1/responses';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for chunked parsing');
    }
    this.openaiApiKey = apiKey;
  }

  /**
   * Parses a large PDF by splitting it into pages and processing each page separately.
   * 
   * @param pdfBuffer - Raw PDF bytes
   * @param filename - Original filename
   * @param logs - Array to append log messages to
   * @returns Merged UniversalFitnessPlan
   */
  async parsePdfInChunks(
    pdfBuffer: Buffer,
    filename: string,
    logs: string[] = []
  ): Promise<UniversalFitnessPlan> {
    const log = (message: string) => {
      console.log(message);
      logs.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`);
    };

    log(`[ChunkedParser] Starting chunked parsing for ${filename}`);

    // Step 1: Extract pages from PDF
    log('[ChunkedParser] Extracting pages from PDF...');
    const pages = await pdfService.extractPagesFromPdf(pdfBuffer);
    const totalPages = pages.length;
    log(`[ChunkedParser] Extracted ${totalPages} pages`);

    if (totalPages === 0) {
      throw new Error('PDF contains no pages');
    }

    // Step 2: Process each page with OpenAI
    const partialPlans: UniversalFitnessPlan[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageNum = page.pageNumber;

      try {
        log(`[ChunkedParser] Processing page ${pageNum}/${totalPages}...`);

        const partialPlan = await this.parsePage(page, pageNum, logs);
        partialPlans.push(partialPlan);
        successCount++;

        log(`[ChunkedParser] Page ${pageNum}/${totalPages} processed successfully`);
      } catch (error: any) {
        failCount++;
        const errorMsg = error?.message || 'Unknown error';
        log(`[ChunkedParser] Page ${pageNum}/${totalPages} failed: ${errorMsg}`);

        // Fail fast: if a page fails, abort the entire operation
        throw new Error(
          `Failed to process page ${pageNum}/${totalPages}: ${errorMsg}. ` +
          `Successfully processed ${successCount} pages before failure.`
        );
      }
    }

    log(`[ChunkedParser] All ${totalPages} pages processed successfully`);

    // Step 3: Merge all partial plans
    log('[ChunkedParser] Merging partial plans...');
    const mergedPlan = mergeService.mergePageResults(partialPlans);

    // Sort debug.pages by page_number
    if (mergedPlan.debug?.pages) {
      mergedPlan.debug.pages.sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
    }

    log(`[ChunkedParser] Merge complete - total debug.pages: ${mergedPlan.debug?.pages?.length || 0}`);
    log(`[ChunkedParser] Merged counts: workouts=${mergedPlan.workouts?.length || 0}, ` +
        `nutrition=${mergedPlan.nutrition_plan?.length || 0}, ` +
        `cardio=${mergedPlan.cardio_sessions?.length || 0}`);

    return mergedPlan;
  }

  /**
   * Parses a single page by calling OpenAI Responses API.
   * 
   * @param page - Extracted page data
   * @param pageNumber - Page number (1-based)
   * @param logs - Array to append log messages to
   * @returns Partial UniversalFitnessPlan for this page
   */
  private async parsePage(
    page: PdfPage,
    pageNumber: number,
    logs: string[] = []
  ): Promise<UniversalFitnessPlan> {
    const log = (message: string) => {
      console.log(message);
      logs.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${message}`);
    };

    const pageText = page.text || `[Page ${pageNumber} - No text extracted]`;

    // Build the per-page prompt
    const pagePrompt = `${UNIVERSAL_PARSE_INSTRUCTIONS}\n\nPAGE_NUMBER: ${pageNumber}\n\nPAGE_TEXT:\n${pageText}`;

    // Build OpenAI payload
    const payload = {
      model: 'gpt-4.1-mini', // Use mini for per-page calls to reduce costs
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: pagePrompt
            }
          ]
        }
      ],
      text: {
        format: { type: 'json_object' }
      },
      max_output_tokens: 3000 // Smaller output per page
    };

    try {
      const response = await axios.post(this.openaiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5 * 60 * 1000 // 5 minutes per page
      });

      if (response.status !== 200) {
        const errorBody = response.data || {};
        throw new Error(`OpenAI API returned status ${response.status}: ${JSON.stringify(errorBody)}`);
      }

      const json = response.data;

      // Extract JSON text from Responses API result
      let output = json.output_text;

      if (!output) {
        if (Array.isArray(json.output)) {
          const first = json.output.find(
            (c: any) => Array.isArray(c.content) && c.content[0]?.type === 'output_text'
          );
          if (first && first.content && first.content[0]) {
            output = first.content[0].text;
          }
        } else if (typeof json.output === 'string') {
          output = json.output;
        }
      }

      if (!output) {
        throw new Error('Empty model output from OpenAI');
      }

      // Parse JSON
      let parsed: UniversalFitnessPlan;
      try {
        parsed = JSON.parse(output);
      } catch (e) {
        // Fallback: try to extract JSON substring
        const match = output.match(/\{[\s\S]*\}/);
        if (!match) {
          throw e;
        }
        parsed = JSON.parse(match[0]);
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response structure from OpenAI');
      }

      // Ensure debug.pages exists and contains this page
      if (!parsed.debug) {
        parsed.debug = { pages: [] };
      }
      if (!Array.isArray(parsed.debug.pages)) {
        parsed.debug.pages = [];
      }

      // Ensure this page is in debug.pages with correct page_number
      const pageInDebug = parsed.debug.pages.find((p: any) => p.page_number === pageNumber);
      if (!pageInDebug) {
        parsed.debug.pages.push({
          page_number: pageNumber,
          raw_text: pageText,
          detected_elements: [],
          mapped_to: [],
          notes: 'Extracted from chunked parsing'
        });
      } else {
        // Update raw_text if it's missing or incomplete
        if (!pageInDebug.raw_text || pageInDebug.raw_text.length < pageText.length) {
          pageInDebug.raw_text = pageText;
        }
      }

      return parsed;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const body = error.response.data || {};
        throw new Error(`OpenAI API error (status ${status}): ${JSON.stringify(body)}`);
      }
      throw error;
    }
  }
}

export const chunkedParserService = new ChunkedParserService();

