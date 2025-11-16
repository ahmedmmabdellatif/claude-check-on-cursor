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
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const DATABASE_URL = process.env.DATABASE_URL;
  const WORKER_URL = process.env.WORKER_URL;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!WORKER_URL) {
    throw new Error('WORKER_URL environment variable is required');
  }

  return {
    PORT,
    DATABASE_URL,
    WORKER_URL,
    NODE_ENV,
  };
}

export const config = validateEnv();
