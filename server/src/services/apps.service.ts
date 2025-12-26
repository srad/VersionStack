import { injectable, inject } from 'tsyringe';
import { Request } from 'express';
import { AppsRepository, CreateAppData, UpdateAppData } from '../repositories/apps.repository';
import { VersionsRepository } from '../repositories/versions.repository';
import { FileStorage } from '../storage/file-storage';
import { auditLog } from '../utils/audit';
import { App, AppResponse, toAppResponse } from '../types';
import { AppNotFoundError, AlreadyExistsError } from '../errors';

export interface DeleteAppResult {
  message: string;
  deleted: {
    appKey: string;
    versionsCount: number;
  };
}

export interface CreateAppResult {
  id: number;
  appKey: string;
  displayName: string;
  isPublic: boolean;
}

@injectable()
export class AppsService {
  constructor(
    private appsRepo: AppsRepository,
    private versionsRepo: VersionsRepository,
    private fileStorage: FileStorage
  ) {}

  async listApps(appScope: string[] | null | undefined): Promise<AppResponse[]> {
    let apps: App[];
    if (appScope && appScope.length > 0) {
      apps = await this.appsRepo.findByScope(appScope);
    } else {
      apps = await this.appsRepo.findAll();
    }
    return apps.map(toAppResponse);
  }

  async getApp(appKey: string): Promise<AppResponse> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }
    return toAppResponse(app);
  }

  async createApp(data: CreateAppData, req: Request): Promise<CreateAppResult> {
    const exists = await this.appsRepo.exists(data.appKey);
    if (exists) {
      throw new AlreadyExistsError('App with this key');
    }

    const id = await this.appsRepo.create(data);

    await auditLog.appCreate(req, data.appKey, data.displayName);

    return {
      id,
      appKey: data.appKey,
      displayName: data.displayName,
      isPublic: data.isPublic,
    };
  }

  async updateApp(appKey: string, data: UpdateAppData, req: Request): Promise<AppResponse> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    if (data.displayName !== undefined || data.isPublic !== undefined) {
      await this.appsRepo.update(appKey, data);
      await auditLog.appUpdate(req, appKey, { ...data });
    }

    // Return updated app
    const updatedApp: App = {
      ...app,
      display_name: data.displayName !== undefined ? data.displayName : app.display_name,
      is_public: data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : app.is_public,
    };

    return toAppResponse(updatedApp);
  }

  async deleteApp(appKey: string, req: Request): Promise<DeleteAppResult> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    // Get version count for response
    const versions = await this.versionsRepo.findByAppId(app.id);
    const versionsCount = versions.length;

    // Use transaction for database operations
    await this.appsRepo.withTransaction(async () => {
      // Clear current_version_id to break FK reference
      await this.appsRepo.clearCurrentVersion(app.id);

      // Delete all version_files
      await this.versionsRepo.deleteFilesByAppId(app.id);

      // Delete all versions
      await this.versionsRepo.deleteByAppId(app.id);

      // Delete the app
      await this.appsRepo.delete(app.id);
    });

    // Delete files AFTER successful DB transaction
    await this.fileStorage.deleteAppDirectory(appKey);

    await auditLog.appDelete(req, appKey, versionsCount);

    return {
      message: 'App and all versions deleted successfully',
      deleted: {
        appKey,
        versionsCount,
      },
    };
  }
}
