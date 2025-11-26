// job-schema.ts - ParseJob database schema and initialization
import { db } from './sqlite-client';

export interface ParseJob {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  createdAt: string;
  updatedAt: string;
  startedAt: string | null; // Timestamp when processing started
  sourceFilename: string;
  r2Key: string | null; // R2 object key where PDF is stored
  totalPages: number;
  processedPages: number;
  totalChunks: number;
  processedChunks: number;
  resultJson: string | null; // Raw UniversalFitnessPlan JSON
  normalizedJson: string | null; // Normalized ProgramForTracking JSON
  error: string | null;
}

// Initialize ParseJob table
export function initializeJobTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ParseJob (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'done', 'error')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      startedAt TEXT,
      sourceFilename TEXT NOT NULL,
      r2Key TEXT,
      totalPages INTEGER NOT NULL,
      processedPages INTEGER NOT NULL DEFAULT 0,
      totalChunks INTEGER NOT NULL,
      processedChunks INTEGER NOT NULL DEFAULT 0,
      resultJson TEXT,
      normalizedJson TEXT,
      error TEXT
    )
  `);
  
  // Migrate existing tables to add missing columns if they don't exist
  try {
    db.exec(`ALTER TABLE ParseJob ADD COLUMN startedAt TEXT`);
    console.log('[DB] Added startedAt column to ParseJob table');
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes('duplicate column')) {
      console.warn('[DB] Migration note (startedAt):', error.message);
    }
  }
  
  try {
    db.exec(`ALTER TABLE ParseJob ADD COLUMN r2Key TEXT`);
    console.log('[DB] Added r2Key column to ParseJob table');
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes('duplicate column')) {
      console.warn('[DB] Migration note (r2Key):', error.message);
    }
  }
  
  try {
    db.exec(`ALTER TABLE ParseJob ADD COLUMN normalizedJson TEXT`);
    console.log('[DB] Added normalizedJson column to ParseJob table');
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes('duplicate column')) {
      console.warn('[DB] Migration note (normalizedJson):', error.message);
    }
  }
  
  console.log('[DB] ParseJob table initialized');
}

// Helper functions for ParseJob operations
export const jobDb = {
  create(job: ParseJob): void {
    db.prepare(`
      INSERT INTO ParseJob (id, status, createdAt, updatedAt, startedAt, sourceFilename, r2Key, totalPages, processedPages, totalChunks, processedChunks, resultJson, normalizedJson, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id,
      job.status,
      job.createdAt,
      job.updatedAt,
      job.startedAt,
      job.sourceFilename,
      job.r2Key,
      job.totalPages,
      job.processedPages,
      job.totalChunks,
      job.processedChunks,
      job.resultJson,
      job.normalizedJson,
      job.error
    );
  },

  getById(id: string): ParseJob | null {
    const row = db.prepare('SELECT * FROM ParseJob WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      status: row.status as ParseJob['status'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      startedAt: row.startedAt,
      sourceFilename: row.sourceFilename,
      r2Key: row.r2Key,
      totalPages: row.totalPages,
      processedPages: row.processedPages,
      totalChunks: row.totalChunks,
      processedChunks: row.processedChunks,
      resultJson: row.resultJson,
      normalizedJson: row.normalizedJson || null,
      error: row.error
    };
  },

  updateStatus(id: string, status: ParseJob['status'], error?: string): void {
    const updatedAt = new Date().toISOString();
    const startedAt = status === 'processing' ? updatedAt : null;
    
    if (error !== undefined) {
      if (startedAt) {
        db.prepare('UPDATE ParseJob SET status = ?, updatedAt = ?, startedAt = ?, error = ? WHERE id = ?')
          .run(status, updatedAt, startedAt, error, id);
      } else {
        db.prepare('UPDATE ParseJob SET status = ?, updatedAt = ?, error = ? WHERE id = ?')
          .run(status, updatedAt, error, id);
      }
    } else {
      if (startedAt) {
        db.prepare('UPDATE ParseJob SET status = ?, updatedAt = ?, startedAt = ? WHERE id = ?')
          .run(status, updatedAt, startedAt, id);
      } else {
        db.prepare('UPDATE ParseJob SET status = ?, updatedAt = ? WHERE id = ?')
          .run(status, updatedAt, id);
      }
    }
  },

  updateProgress(id: string, processedPages: number, processedChunks: number): void {
    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE ParseJob SET processedPages = ?, processedChunks = ?, updatedAt = ? WHERE id = ?')
      .run(processedPages, processedChunks, updatedAt, id);
  },

  setResult(id: string, resultJson: string): void {
    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE ParseJob SET resultJson = ?, status = ?, updatedAt = ? WHERE id = ?')
      .run(resultJson, 'done', updatedAt, id);
  },

  setNormalized(id: string, normalizedJson: string): void {
    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE ParseJob SET normalizedJson = ?, updatedAt = ? WHERE id = ?')
      .run(normalizedJson, updatedAt, id);
  }
};

