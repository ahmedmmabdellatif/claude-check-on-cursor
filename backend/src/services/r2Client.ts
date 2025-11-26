// r2Client.ts - Cloudflare R2 storage client using AWS S3 SDK
// R2 is S3-compatible, so we use @aws-sdk/client-s3

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/env';

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' for region
  endpoint: config.R2_ENDPOINT,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a PDF buffer to R2 storage.
 * 
 * @param buffer - PDF file buffer
 * @param key - R2 object key (e.g., "jobs/{jobId}/source.pdf")
 * @returns Promise<string> - The R2 object key
 */
export async function uploadPdfToR2(buffer: Buffer, key: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
      // Do NOT make public - internal only
    });

    await r2Client.send(command);
    console.log(`[R2Client] Uploaded PDF to R2: ${key} (${buffer.length} bytes)`);
    return key;
  } catch (error: any) {
    console.error(`[R2Client] Error uploading to R2:`, error);
    throw new Error(`Failed to upload PDF to R2: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Downloads a PDF from R2 storage.
 * 
 * @param key - R2 object key (e.g., "jobs/{jobId}/source.pdf")
 * @returns Promise<Buffer> - PDF file buffer
 */
export async function downloadPdfFromR2(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      throw new Error(`R2 object ${key} has no body`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`[R2Client] Downloaded PDF from R2: ${key} (${buffer.length} bytes)`);
    return buffer;
  } catch (error: any) {
    console.error(`[R2Client] Error downloading from R2:`, error);
    throw new Error(`Failed to download PDF from R2: ${error.message || 'Unknown error'}`);
  }
}

