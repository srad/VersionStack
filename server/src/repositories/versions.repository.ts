import { injectable, inject } from 'tsyringe';
import { Database } from 'sqlite';
import { BaseRepository, DATABASE_TOKEN } from './base.repository';
import { Version, VersionFile } from '../types';

export interface CreateVersionData {
  appId: number;
  versionName: string;
}

export interface CreateVersionFileData {
  versionId: number;
  fileName: string;
  fileHash: string;
  fileSize: number;
}

export interface VersionWithFiles extends Version {
  files: VersionFile[];
}

@injectable()
export class VersionsRepository extends BaseRepository {
  constructor(@inject(DATABASE_TOKEN) db: Database) {
    super(db);
  }

  async findByAppId(appId: number): Promise<Version[]> {
    return this.executeAll<Version>(
      'SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC',
      appId
    );
  }

  async findById(id: number): Promise<Version | undefined> {
    return this.executeGet<Version>('SELECT * FROM versions WHERE id = ?', id);
  }

  async findByIdAndAppId(id: number, appId: number): Promise<Version | undefined> {
    return this.executeGet<Version>(
      'SELECT * FROM versions WHERE id = ? AND app_id = ?',
      id,
      appId
    );
  }

  async findByAppIdAndName(appId: number, versionName: string): Promise<Version | undefined> {
    return this.executeGet<Version>(
      'SELECT id FROM versions WHERE app_id = ? AND version_name = ?',
      appId,
      versionName
    );
  }

  async findLatest(appId: number): Promise<Version | undefined> {
    return this.executeGet<Version>(
      'SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1',
      appId
    );
  }

  async findLatestVersionName(appId: number): Promise<string | null> {
    const result = await this.executeGet<{ version_name: string }>(
      'SELECT version_name FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1',
      appId
    );
    return result?.version_name ?? null;
  }

  async create(data: CreateVersionData): Promise<number> {
    const result = await this.executeRun(
      'INSERT INTO versions (app_id, version_name, is_active) VALUES (?, ?, 1)',
      data.appId,
      data.versionName
    );
    return result.lastID;
  }

  async delete(versionId: number): Promise<void> {
    await this.executeRun('DELETE FROM versions WHERE id = ?', versionId);
  }

  async deleteByAppId(appId: number): Promise<void> {
    await this.executeRun('DELETE FROM versions WHERE app_id = ?', appId);
  }

  // Version Files

  async findFilesByVersionId(versionId: number): Promise<VersionFile[]> {
    return this.executeAll<VersionFile>(
      'SELECT * FROM version_files WHERE version_id = ? ORDER BY file_name',
      versionId
    );
  }

  async createFile(data: CreateVersionFileData): Promise<number> {
    const result = await this.executeRun(
      'INSERT INTO version_files (version_id, file_name, file_hash, file_size) VALUES (?, ?, ?, ?)',
      data.versionId,
      data.fileName,
      data.fileHash,
      data.fileSize
    );
    return result.lastID;
  }

  async deleteFilesByVersionId(versionId: number): Promise<void> {
    await this.executeRun('DELETE FROM version_files WHERE version_id = ?', versionId);
  }

  async deleteFilesByAppId(appId: number): Promise<void> {
    await this.executeRun(
      'DELETE FROM version_files WHERE version_id IN (SELECT id FROM versions WHERE app_id = ?)',
      appId
    );
  }

  // Optimized query to get all versions with their files in fewer queries
  async findAllWithFiles(appId: number): Promise<VersionWithFiles[]> {
    const versions = await this.findByAppId(appId);
    if (versions.length === 0) {
      return [];
    }

    const versionIds = versions.map((v) => v.id);
    const placeholders = versionIds.map(() => '?').join(',');

    const allFiles = await this.executeAll<VersionFile>(
      `SELECT * FROM version_files WHERE version_id IN (${placeholders}) ORDER BY file_name`,
      ...versionIds
    );

    // Group files by version_id
    const filesByVersionId = new Map<number, VersionFile[]>();
    for (const file of allFiles) {
      const existing = filesByVersionId.get(file.version_id) || [];
      existing.push(file);
      filesByVersionId.set(file.version_id, existing);
    }

    return versions.map((version) => ({
      ...version,
      files: filesByVersionId.get(version.id) || [],
    }));
  }
}
