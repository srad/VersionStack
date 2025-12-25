import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      actor_key_id INTEGER,
      actor_ip TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(actor_key_id) REFERENCES api_keys(id)
    );

    CREATE INDEX idx_audit_log_action ON audit_log(action);
    CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
    CREATE INDEX idx_audit_log_actor ON audit_log(actor_key_id);
    CREATE INDEX idx_audit_log_created ON audit_log(created_at);
  `);
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS idx_audit_log_created;
    DROP INDEX IF EXISTS idx_audit_log_actor;
    DROP INDEX IF EXISTS idx_audit_log_entity;
    DROP INDEX IF EXISTS idx_audit_log_action;
    DROP TABLE IF EXISTS audit_log;
  `);
}
