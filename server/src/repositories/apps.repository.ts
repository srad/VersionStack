import { injectable, inject } from 'tsyringe';
import { Database } from 'sqlite';
import { BaseRepository, DATABASE_TOKEN } from './base.repository';
import { App } from '../types';

export interface CreateAppData {
  appKey: string;
  displayName: string;
  isPublic: boolean;
}

export interface UpdateAppData {
  displayName?: string;
  isPublic?: boolean;
}

@injectable()
export class AppsRepository extends BaseRepository {
  constructor(@inject(DATABASE_TOKEN) db: Database) {
    super(db);
  }

  async findAll(): Promise<App[]> {
    return this.executeAll<App>('SELECT * FROM apps ORDER BY display_name');
  }

  async findByScope(appKeys: string[]): Promise<App[]> {
    if (appKeys.length === 0) {
      return [];
    }
    const placeholders = appKeys.map(() => '?').join(',');
    return this.executeAll<App>(
      `SELECT * FROM apps WHERE app_key IN (${placeholders}) ORDER BY display_name`,
      ...appKeys
    );
  }

  async findByKey(appKey: string): Promise<App | undefined> {
    return this.executeGet<App>('SELECT * FROM apps WHERE app_key = ?', appKey);
  }

  async findById(id: number): Promise<App | undefined> {
    return this.executeGet<App>('SELECT * FROM apps WHERE id = ?', id);
  }

  async exists(appKey: string): Promise<boolean> {
    const result = await this.executeGet<{ id: number }>(
      'SELECT id FROM apps WHERE app_key = ?',
      appKey
    );
    return result !== undefined;
  }

  async create(data: CreateAppData): Promise<number> {
    const result = await this.executeRun(
      'INSERT INTO apps (app_key, display_name, is_public) VALUES (?, ?, ?)',
      data.appKey,
      data.displayName,
      data.isPublic ? 1 : 0
    );
    return result.lastID;
  }

  async update(appKey: string, data: UpdateAppData): Promise<void> {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.displayName !== undefined) {
      updates.push('display_name = ?');
      values.push(data.displayName);
    }
    if (data.isPublic !== undefined) {
      updates.push('is_public = ?');
      values.push(data.isPublic ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(appKey);
      await this.executeRun(
        `UPDATE apps SET ${updates.join(', ')} WHERE app_key = ?`,
        ...values
      );
    }
  }

  async setCurrentVersion(appId: number, versionId: number | null): Promise<void> {
    await this.executeRun(
      'UPDATE apps SET current_version_id = ? WHERE id = ?',
      versionId,
      appId
    );
  }

  async clearCurrentVersion(appId: number): Promise<void> {
    await this.setCurrentVersion(appId, null);
  }

  async delete(appId: number): Promise<void> {
    await this.executeRun('DELETE FROM apps WHERE id = ?', appId);
  }
}
