import { Umzug, RunnableMigration } from 'umzug';
import { Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Custom storage for SQLite using the sqlite package
class SQLiteStorage {
  private db: Database;
  private tableName: string;

  constructor(db: Database, tableName = 'migrations') {
    this.db = db;
    this.tableName = tableName;
  }

  async logMigration(params: { name: string }): Promise<void> {
    await this.db.run(
      `INSERT INTO ${this.tableName} (name, executed_at) VALUES (?, datetime('now'))`,
      params.name
    );
  }

  async unlogMigration(params: { name: string }): Promise<void> {
    await this.db.run(
      `DELETE FROM ${this.tableName} WHERE name = ?`,
      params.name
    );
  }

  async executed(): Promise<string[]> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL
      )
    `);

    const rows = await this.db.all<{ name: string }[]>(
      `SELECT name FROM ${this.tableName} ORDER BY id`
    );
    return rows.map((r) => r.name);
  }
}

export interface MigrationContext {
  db: Database;
}

export function createMigrator(db: Database) {
  const migrationsPath = path.join(__dirname, 'migrations');

  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsPath)) {
    fs.mkdirSync(migrationsPath, { recursive: true });
  }

  // Detect if running compiled JS or TypeScript source
  // In production (compiled), __filename ends with .js
  const isCompiled = __filename.endsWith('.js');
  const globPattern = isCompiled ? '*.js' : '*.ts';

  return new Umzug({
    migrations: {
      glob: [globPattern, { cwd: migrationsPath }],
      resolve: ({ name, path: migrationPath }: { name: string; path?: string }): RunnableMigration<MigrationContext> => {
        // Normalize name to .ts extension for consistent tracking in migrations table
        // Prevents same migration being recorded as both .ts and .js
        const normalizedName = name.replace(/\.js$/, '.ts');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const migration = require(migrationPath!);
        return {
          name: normalizedName,
          up: async () => migration.up({ db }),
          down: async () => migration.down?.({ db }),
        };
      },
    },
    context: { db },
    storage: new SQLiteStorage(db),
    logger: console,
  });
}

export async function runMigrations(db: Database): Promise<void> {
  const migrator = createMigrator(db);

  const pending = await migrator.pending();
  if (pending.length > 0) {
    console.log(`Running ${pending.length} pending migration(s)...`);
    await migrator.up();
    console.log('Migrations completed successfully');
  } else {
    console.log('No pending migrations');
  }
}
