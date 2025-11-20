const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'dev.db');
console.log('Opening DB at:', dbPath);

const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

try {
  const count = db.prepare('SELECT count(*) as c FROM ParsedPlan').get();
  console.log('ParsedPlan count:', count);
} catch (e) {
  console.error('Error querying ParsedPlan:', e.message);
}
