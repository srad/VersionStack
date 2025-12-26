import { Database } from 'sqlite';
import { DatabaseError } from '../errors';

export abstract class BaseRepository {
  constructor(protected readonly db: Database) {}

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.db.run('BEGIN TRANSACTION');
    try {
      const result = await fn();
      await this.db.run('COMMIT');
      return result;
    } catch (err) {
      await this.db.run('ROLLBACK');
      throw err;
    }
  }

  protected async executeRun(
    sql: string,
    ...params: unknown[]
  ): Promise<{ lastID: number; changes: number }> {
    try {
      const result = await this.db.run(sql, ...params);
      return {
        lastID: result.lastID ?? 0,
        changes: result.changes ?? 0,
      };
    } catch (err) {
      console.error('Database run error:', err);
      throw new DatabaseError('Failed to execute database operation');
    }
  }

  protected async executeGet<T>(sql: string, ...params: unknown[]): Promise<T | undefined> {
    try {
      return await this.db.get<T>(sql, ...params);
    } catch (err) {
      console.error('Database get error:', err);
      throw new DatabaseError('Failed to fetch from database');
    }
  }

  protected async executeAll<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    try {
      return await this.db.all<T[]>(sql, ...params);
    } catch (err) {
      console.error('Database all error:', err);
      throw new DatabaseError('Failed to fetch from database');
    }
  }
}

export const DATABASE_TOKEN = 'Database';
