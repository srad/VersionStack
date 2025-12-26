import { injectable, inject } from 'tsyringe';
import { Database } from 'sqlite';
import crypto from 'crypto';
import { BaseRepository, DATABASE_TOKEN } from './base.repository';
import { ApiKey, Permission } from '../types';

export interface CreateApiKeyData {
  name: string;
  permission: Permission;
  appScope: string[] | null;
  createdByKeyId: number | null;
}

@injectable()
export class ApiKeysRepository extends BaseRepository {
  constructor(@inject(DATABASE_TOKEN) db: Database) {
    super(db);
  }

  async findAll(): Promise<ApiKey[]> {
    return this.executeAll<ApiKey>(
      `SELECT id, key_hash, name, permission, app_scope, is_active,
              created_at, last_used_at, created_by_key_id
       FROM api_keys
       ORDER BY created_at DESC`
    );
  }

  async findById(id: number): Promise<ApiKey | undefined> {
    return this.executeGet<ApiKey>('SELECT * FROM api_keys WHERE id = ?', id);
  }

  async findByHash(keyHash: string): Promise<ApiKey | undefined> {
    return this.executeGet<ApiKey>(
      'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1',
      keyHash
    );
  }

  async create(data: CreateApiKeyData): Promise<{ id: number; plainKey: string }> {
    const plainKey = this.generateApiKey();
    const keyHash = this.hashApiKey(plainKey);

    const result = await this.executeRun(
      `INSERT INTO api_keys (key_hash, name, permission, app_scope, created_by_key_id)
       VALUES (?, ?, ?, ?, ?)`,
      keyHash,
      data.name,
      data.permission,
      data.appScope && data.appScope.length > 0 ? JSON.stringify(data.appScope) : null,
      data.createdByKeyId
    );

    return { id: result.lastID, plainKey };
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.executeRun(
      'UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?',
      id
    );
  }

  async revoke(id: number): Promise<void> {
    await this.executeRun('UPDATE api_keys SET is_active = 0 WHERE id = ?', id);
  }

  hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
