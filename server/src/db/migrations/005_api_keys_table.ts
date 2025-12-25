import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  console.log('Creating api_keys table...');

  await db.exec(`
    CREATE TABLE api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('read', 'write', 'admin')),
      app_scope TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      created_by_key_id INTEGER,
      FOREIGN KEY(created_by_key_id) REFERENCES api_keys(id)
    );

    CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX idx_api_keys_active ON api_keys(is_active);
  `);

  console.log('Successfully created api_keys table');
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS idx_api_keys_active;
    DROP INDEX IF EXISTS idx_api_keys_hash;
    DROP TABLE IF EXISTS api_keys;
  `);
}
