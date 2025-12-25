import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_key TEXT UNIQUE NOT NULL,
      display_name TEXT,
      current_version_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      version_name TEXT NOT NULL,
      file_name TEXT,
      file_hash TEXT,
      file_size INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(app_id) REFERENCES apps(id)
    );
  `);
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    DROP TABLE IF EXISTS versions;
    DROP TABLE IF EXISTS apps;
  `);
}
