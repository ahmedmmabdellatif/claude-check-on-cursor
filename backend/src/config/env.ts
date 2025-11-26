import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
// When using tsx, we need to explicitly resolve the path
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  WORKER_URL: string;
  OPENAI_API_KEY?: string;
  NODE_ENV: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET: string;
}

function validateEnv(): EnvConfig {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const DATABASE_URL = process.env.DATABASE_URL;
  // Support both PROCESSOR_URL and WORKER_URL (PROCESSOR_URL takes precedence)
  const WORKER_URL = process.env.PROCESSOR_URL || process.env.WORKER_URL;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Optional - only needed for chunked mode
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // R2 Storage credentials
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_ENDPOINT = process.env.R2_ENDPOINT;
  const R2_BUCKET = process.env.R2_BUCKET;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!WORKER_URL) {
    throw new Error('PROCESSOR_URL or WORKER_URL environment variable is required');
  }

  if (!R2_ACCESS_KEY_ID) {
    throw new Error('R2_ACCESS_KEY_ID environment variable is required');
  }

  if (!R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_SECRET_ACCESS_KEY environment variable is required');
  }

  if (!R2_ENDPOINT) {
    throw new Error('R2_ENDPOINT environment variable is required');
  }

  if (!R2_BUCKET) {
    throw new Error('R2_BUCKET environment variable is required');
  }

  // Clean R2_ENDPOINT - remove @ prefix if present
  const cleanedEndpoint = R2_ENDPOINT.startsWith('@') ? R2_ENDPOINT.substring(1) : R2_ENDPOINT;

  return {
    PORT,
    DATABASE_URL,
    WORKER_URL,
    OPENAI_API_KEY,
    NODE_ENV,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT: cleanedEndpoint,
    R2_BUCKET,
  };
}

export const config = validateEnv();
