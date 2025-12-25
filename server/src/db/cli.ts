import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { createMigrator } from './migrator';

async function main() {
  const command = process.argv[2] || 'up';

  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(process.cwd(), 'data/registry.db');

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');

  const migrator = createMigrator(db);

  switch (command) {
    case 'up':
      console.log('Running all pending migrations...');
      const upResult = await migrator.up();
      if (upResult.length > 0) {
        console.log('Applied migrations:');
        upResult.forEach((m: { name: string }) => console.log(`  - ${m.name}`));
      } else {
        console.log('No pending migrations');
      }
      break;

    case 'down':
      console.log('Reverting last migration...');
      const downResult = await migrator.down();
      if (downResult.length > 0) {
        console.log('Reverted migrations:');
        downResult.forEach((m: { name: string }) => console.log(`  - ${m.name}`));
      } else {
        console.log('No migrations to revert');
      }
      break;

    case 'status':
      const pending = await migrator.pending();
      const executed = await migrator.executed();

      console.log('\nExecuted migrations:');
      if (executed.length > 0) {
        executed.forEach((m: { name: string }) => console.log(`  ✓ ${m.name}`));
      } else {
        console.log('  (none)');
      }

      console.log('\nPending migrations:');
      if (pending.length > 0) {
        pending.forEach((m: { name: string }) => console.log(`  ○ ${m.name}`));
      } else {
        console.log('  (none)');
      }
      break;

    case 'create':
      const name = process.argv[3];
      if (!name) {
        console.error('Usage: npm run migrate:create <name>');
        process.exit(1);
      }

      const timestamp = Date.now();
      const filename = `${timestamp}_${name}.ts`;
      const migrationsDir = path.join(__dirname, 'migrations');

      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }

      const template = `import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  // Add your migration logic here
  await db.exec(\`
    -- Your SQL here
  \`);
}

export async function down({ db }: MigrationContext): Promise<void> {
  // Add your rollback logic here
  await db.exec(\`
    -- Your rollback SQL here
  \`);
}
`;

      const filepath = path.join(migrationsDir, filename);
      fs.writeFileSync(filepath, template);
      console.log(`Created migration: ${filename}`);
      break;

    default:
      console.log(`
Usage: npm run migrate [command]

Commands:
  up       Run all pending migrations (default)
  down     Revert the last migration
  status   Show migration status
  create   Create a new migration file
`);
  }

  await db.close();
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
