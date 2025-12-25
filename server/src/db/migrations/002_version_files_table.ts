import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  // Create version_files table for multiple files per version
  await db.exec(`
    CREATE TABLE IF NOT EXISTS version_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(version_id) REFERENCES versions(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing file data from versions table to version_files
  const hasFileColumn = await db.get<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM pragma_table_info('versions') WHERE name='file_name'"
  );

  if (hasFileColumn && hasFileColumn.cnt > 0) {
    // Check if there's data to migrate
    const existingData = await db.get<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM versions WHERE file_name IS NOT NULL'
    );

    if (existingData && existingData.cnt > 0) {
      await db.exec(`
        INSERT INTO version_files (version_id, file_name, file_hash, file_size, created_at)
        SELECT id, file_name, file_hash, file_size, created_at
        FROM versions
        WHERE file_name IS NOT NULL
      `);
      console.log(`Migrated ${existingData.cnt} file(s) to version_files table`);
    }
  }
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec('DROP TABLE IF EXISTS version_files');
}
