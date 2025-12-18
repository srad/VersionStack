import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDb = async () => {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'data/registry.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_key TEXT UNIQUE NOT NULL,
      display_name TEXT,
      current_version_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(current_version_id) REFERENCES versions(id)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      version_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(app_id) REFERENCES apps(id)
    );
  `);

  // Migration: Add current_version_id to apps if missing
  try {
    await db.exec('ALTER TABLE apps ADD COLUMN current_version_id INTEGER REFERENCES versions(id)');
    console.log('Migrated: Added current_version_id to apps table');
  } catch (err: any) {
    // Ignore error if column already exists
  }

  console.log('Database initialized');
  return db;
};

export const getDb = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};
