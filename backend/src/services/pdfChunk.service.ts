// pdfChunk.service.ts - PDF chunking service using pdf-lib
// Splits a PDF into page-range chunks and creates sub-PDFs

import { PDFDocument } from 'pdf-lib';

export interface PdfChunk {
  chunkIndex: number;
  startPage: number; // 1-based
  endPage: number;   // 1-based (inclusive)
  pdfBuffer: Buffer;
}

export class PdfChunkService {
  /**
   * Splits a PDF into chunks of specified page size.
   * 
   * @param pdfBuffer - Original PDF buffer
   * @param pagesPerChunk - Number of pages per chunk (default: 5)
   * @returns Array of PdfChunk objects
   */
  async splitPdfIntoChunks(
    pdfBuffer: Buffer,
    pagesPerChunk: number = 5
  ): Promise<PdfChunk[]> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('PDF contains no pages');
    }

    const chunks: PdfChunk[] = [];
    let chunkIndex = 0;

    for (let startPage = 0; startPage < totalPages; startPage += pagesPerChunk) {
      const endPage = Math.min(startPage + pagesPerChunk - 1, totalPages - 1);
      
      // Create a new PDF document for this chunk
      const chunkDoc = await PDFDocument.create();
      
      // Copy pages from original PDF
      const pageIndices: number[] = [];
      for (let i = startPage; i <= endPage; i++) {
        pageIndices.push(i);
      }
      
      const copiedPages = await chunkDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => chunkDoc.addPage(page));

      // Serialize chunk PDF to buffer
      const chunkPdfBytes = await chunkDoc.save();
      const chunkBuffer = Buffer.from(chunkPdfBytes);

      chunks.push({
        chunkIndex: chunkIndex++,
        startPage: startPage + 1, // Convert to 1-based
        endPage: endPage + 1,     // Convert to 1-based
        pdfBuffer: chunkBuffer
      });
    }

    return chunks;
  }

  /**
   * Gets the total page count of a PDF.
   */
  async getPageCount(pdfBuffer: Buffer): Promise<number> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  }
}

export const pdfChunkService = new PdfChunkService();

