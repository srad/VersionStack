import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  // Check if the versions table has the legacy file columns
  const columns = await db.all<{ name: string }[]>(
    "SELECT name FROM pragma_table_info('versions')"
  );

  const hasLegacyColumns = columns.some(
    (col) => col.name === 'file_name' || col.name === 'file_hash' || col.name === 'file_size'
  );

  if (!hasLegacyColumns) {
    console.log('Legacy file columns already removed from versions table');
    return;
  }

  // SQLite doesn't support DROP COLUMN directly in older versions
  // We need to recreate the table without the legacy columns
  console.log('Removing legacy file columns from versions table...');

  // Temporarily disable foreign keys for table recreation
  await db.exec('PRAGMA foreign_keys = OFF');

  try {
    await db.exec(`
      -- Clean up any leftover from failed migration
      DROP TABLE IF EXISTS versions_new;

      -- Create new table without legacy columns
      CREATE TABLE versions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id INTEGER NOT NULL,
        version_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(app_id) REFERENCES apps(id)
      );

      -- Copy data from old table
      INSERT INTO versions_new (id, app_id, version_name, is_active, created_at)
      SELECT id, app_id, version_name, is_active, created_at FROM versions;

      -- Drop old table
      DROP TABLE versions;

      -- Rename new table
      ALTER TABLE versions_new RENAME TO versions;

      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_versions_app_id ON versions(app_id);
      CREATE INDEX IF NOT EXISTS idx_versions_app_version ON versions(app_id, version_name);
      CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
    `);

    console.log('Successfully removed legacy file columns from versions table');
  } finally {
    // Re-enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
  }
}

export async function down({ db }: MigrationContext): Promise<void> {
  // Add back the legacy columns (nullable)
  await db.exec(`
    CREATE TABLE versions_old (
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

    INSERT INTO versions_old (id, app_id, version_name, is_active, created_at)
    SELECT id, app_id, version_name, is_active, created_at FROM versions;

    DROP TABLE versions;

    ALTER TABLE versions_old RENAME TO versions;

    CREATE INDEX IF NOT EXISTS idx_versions_app_id ON versions(app_id);
    CREATE INDEX IF NOT EXISTS idx_versions_app_version ON versions(app_id, version_name);
    CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
  `);
}
