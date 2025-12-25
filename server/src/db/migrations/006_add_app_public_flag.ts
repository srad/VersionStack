import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  console.log('Adding is_public column to apps table...');

  await db.exec(`
    ALTER TABLE apps ADD COLUMN is_public INTEGER DEFAULT 0;
  `);

  console.log('Successfully added is_public column to apps table');
}

export async function down({ db }: MigrationContext): Promise<void> {
  // SQLite doesn't support DROP COLUMN directly, but since this is just
  // adding a column, we can leave it in place for down migration
  // or recreate the table without it if needed
  console.log('Note: is_public column will remain in apps table (SQLite limitation)');
}
