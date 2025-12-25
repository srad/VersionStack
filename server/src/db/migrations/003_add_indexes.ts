import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  // Add indexes for better query performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_versions_app_id ON versions(app_id);
    CREATE INDEX IF NOT EXISTS idx_versions_app_version ON versions(app_id, version_name);
    CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_version_files_version_id ON version_files(version_id);
    CREATE INDEX IF NOT EXISTS idx_version_files_hash ON version_files(file_hash);
    CREATE INDEX IF NOT EXISTS idx_apps_app_key ON apps(app_key);
  `);
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS idx_versions_app_id;
    DROP INDEX IF EXISTS idx_versions_app_version;
    DROP INDEX IF EXISTS idx_versions_created_at;
    DROP INDEX IF EXISTS idx_version_files_version_id;
    DROP INDEX IF EXISTS idx_version_files_hash;
    DROP INDEX IF EXISTS idx_apps_app_key;
  `);
}
