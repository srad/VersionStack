import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { runMigrations } from './migrator';

let db: Database | null = null;

export const initDb = async () => {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'data/registry.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  await runMigrations(db);

  console.log('Database initialized');
  return db;
};

export const getDb = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};
