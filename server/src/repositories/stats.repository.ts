import { injectable, inject } from 'tsyringe';
import { Database } from 'sqlite';
import { BaseRepository, DATABASE_TOKEN } from './base.repository';

export interface DashboardStats {
  totalApps: number;
  totalVersions: number;
  totalStorageBytes: number;
  appsWithActiveVersion: number;
  recentUploads: number;
}

@injectable()
export class StatsRepository extends BaseRepository {
  constructor(@inject(DATABASE_TOKEN) db: Database) {
    super(db);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // Total apps
    const appsResult = await this.executeGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM apps'
    );

    // Total versions
    const versionsResult = await this.executeGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM versions'
    );

    // Total storage (sum of all file sizes)
    const storageResult = await this.executeGet<{ total: number | null }>(
      'SELECT SUM(file_size) as total FROM version_files'
    );

    // Apps with active version set
    const activeResult = await this.executeGet<{ count: number }>(
      'SELECT COUNT(*) as count FROM apps WHERE current_version_id IS NOT NULL'
    );

    // Recent uploads (last 7 days) - from audit log
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResult = await this.executeGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM audit_log
       WHERE action = 'version.upload'
       AND created_at >= ?`,
      sevenDaysAgo.toISOString()
    );

    return {
      totalApps: appsResult?.count ?? 0,
      totalVersions: versionsResult?.count ?? 0,
      totalStorageBytes: storageResult?.total ?? 0,
      appsWithActiveVersion: activeResult?.count ?? 0,
      recentUploads: recentResult?.count ?? 0,
    };
  }
}
