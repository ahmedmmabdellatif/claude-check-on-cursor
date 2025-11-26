import pdfParse from 'pdf-parse';

/**
 * PdfPage: Mechanical page extraction result (no AI interpretation)
 */
export type PdfPage = {
  pageNumber: number;
  text?: string;
  imageBase64?: string;
};

export class PdfService {
  /**
   * Extracts pages from PDF buffer (mechanical split only, no AI).
   * Returns ordered array of page objects with text and optional images.
   */
  async extractPagesFromPdf(fileBuffer: Buffer): Promise<PdfPage[]> {
    return this.splitPdf(fileBuffer);
  }

  /**
   * Split PDF into pages (mechanical extraction only).
   */
  async splitPdf(fileBuffer: Buffer): Promise<PdfPage[]> {
    try {
      const data = await pdfParse(fileBuffer);
      const numPages = data.numpages;
      const allText = data.text;

      const pages: PdfPage[] = [];

      // Split text by page breaks (rough estimation)
      const avgCharsPerPage = Math.ceil(allText.length / numPages);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const startIdx = (pageNum - 1) * avgCharsPerPage;
        const endIdx = Math.min(pageNum * avgCharsPerPage, allText.length);
        const pageText = allText.substring(startIdx, endIdx).trim();

        pages.push({
          pageNumber: pageNum,
          text: pageText || `[Page ${pageNum} - No text extracted]`,
          // imageBase64: undefined (not implemented yet)
        });

        console.log(`[PDF Service] Processed page ${pageNum}/${numPages}`);
      }

      console.log(`[PDF Service] Successfully split PDF into ${numPages} pages`);
      return pages;
    } catch (error) {
      console.error('[PDF Service] Error splitting PDF:', error);
      throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfService = new PdfService();
