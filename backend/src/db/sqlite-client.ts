import Database from 'better-sqlite3';
import path from 'path';
import { config } from '../config/env';

// Extract the database path from DATABASE_URL (file:./dev.db -> ./dev.db)
// Force absolute path to backend root to avoid CWD issues
const fullDbPath = path.resolve(__dirname, '../../dev.db');

// Create SQLite database connection
export const db = new Database(fullDbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Database interfaces matching Prisma schema
export interface ParsedPlan {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  sourceFilename: string;
  pagesCount: number;
  status: string;
  metaTitle: string | null;
  metaCoachName: string | null;
  metaDurationWeeks: number | null;
  rawJson: string;
  debugJson: string;
}

export interface MediaAsset {
  id: string;
  createdAt: Date;
  planId: string;
  pageNumber: number | null;
  type: string;
  originalUrl: string;
  resolvedUrl: string | null;
  thumbnailUrl: string | null;
  exerciseName: string | null;
  notes: string | null;
}

// Helper to generate cuid-like IDs
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomStr}`;
}

// Helper to convert ISO string to Date
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export default db;
