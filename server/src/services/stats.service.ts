import { injectable } from 'tsyringe';
import { StatsRepository, DashboardStats } from '../repositories/stats.repository';

export interface StatsResponse {
  totalApps: number;
  totalVersions: number;
  totalStorageBytes: number;
  appsWithActiveVersion: number;
  recentUploads: number;
}

@injectable()
export class StatsService {
  constructor(private statsRepo: StatsRepository) {}

  async getDashboardStats(): Promise<StatsResponse> {
    const stats = await this.statsRepo.getDashboardStats();
    return {
      totalApps: stats.totalApps,
      totalVersions: stats.totalVersions,
      totalStorageBytes: stats.totalStorageBytes,
      appsWithActiveVersion: stats.appsWithActiveVersion,
      recentUploads: stats.recentUploads,
    };
  }
}
