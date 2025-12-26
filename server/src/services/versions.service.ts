import { injectable } from 'tsyringe';
import { Request } from 'express';
import { AppsRepository } from '../repositories/apps.repository';
import { VersionsRepository } from '../repositories/versions.repository';
import { FileStorage, UploadedFile } from '../storage/file-storage';
import { auditLog } from '../utils/audit';
import {
  App,
  Version,
  VersionFile,
  VersionFileResponse,
  LatestVersionResponse,
  toVersionFileResponse,
  JwtPayload,
} from '../types';
import {
  AppNotFoundError,
  VersionNotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors';

export interface VersionResponse {
  id: number;
  versionName: string;
  isActive: boolean;
  createdAt: string;
  files: VersionFileResponse[];
}

export interface UploadVersionResult {
  message: string;
  version: string;
  files: VersionFileResponse[];
}

@injectable()
export class VersionsService {
  constructor(
    private appsRepo: AppsRepository,
    private versionsRepo: VersionsRepository,
    private fileStorage: FileStorage
  ) {}

  async listVersions(appKey: string): Promise<VersionResponse[]> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    const versionsWithFiles = await this.versionsRepo.findAllWithFiles(app.id);

    return versionsWithFiles.map((v) => ({
      id: v.id,
      versionName: v.version_name,
      isActive: v.id === app.current_version_id,
      createdAt: v.created_at,
      files: v.files.map((f) => toVersionFileResponse(f, appKey, v.version_name)),
    }));
  }

  async getLatestVersion(
    appKey: string,
    user: JwtPayload | undefined
  ): Promise<LatestVersionResponse> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    // Check access: public apps are accessible to all, private apps require auth
    if (!app.is_public) {
      if (!user) {
        throw new UnauthorizedError('This app requires authentication');
      }
      // Check app scope access for authenticated users
      if (
        user.appScope !== null &&
        user.permission !== 'admin' &&
        !user.appScope.includes(appKey)
      ) {
        throw new ForbiddenError(`No access to app: ${appKey}`);
      }
    }

    let latestVersion: Version | undefined;

    if (app.current_version_id) {
      latestVersion = await this.versionsRepo.findById(app.current_version_id);
    } else {
      // Fallback to most recent if no active version set
      latestVersion = await this.versionsRepo.findLatest(app.id);
    }

    if (!latestVersion) {
      throw new VersionNotFoundError();
    }

    const files = await this.versionsRepo.findFilesByVersionId(latestVersion.id);

    return {
      version: latestVersion.version_name,
      createdAt: latestVersion.created_at,
      files: files.map((f) => ({
        fileName: f.file_name,
        hash: f.file_hash,
        hashAlgorithm: 'sha256' as const,
        size: f.file_size,
        downloadUrl: `/files/${appKey}/${latestVersion!.version_name}/${f.file_name}`,
      })),
    };
  }

  async uploadVersion(
    appKey: string,
    versionName: string | undefined,
    files: UploadedFile[],
    req: Request
  ): Promise<UploadVersionResult> {
    if (!files || files.length === 0) {
      throw new ValidationError('At least one file is required');
    }

    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      this.fileStorage.cleanupTempFiles(files);
      throw new AppNotFoundError(appKey);
    }

    // Generate version name if not provided
    let finalVersionName = versionName;
    if (!finalVersionName) {
      const lastVersionName = await this.versionsRepo.findLatestVersionName(app.id);
      finalVersionName = this.getNextVersion(lastVersionName);
    }

    // Check if version already exists
    const existing = await this.versionsRepo.findByAppIdAndName(app.id, finalVersionName);
    if (existing) {
      this.fileStorage.cleanupTempFiles(files);
      throw new ConflictError(`Version ${finalVersionName} already exists`);
    }

    try {
      // Create version record
      const versionId = await this.versionsRepo.create({
        appId: app.id,
        versionName: finalVersionName,
      });

      // Process and store each file
      const uploadedFiles: VersionFileResponse[] = [];
      for (const file of files) {
        const fileInfo = await this.fileStorage.saveFile(appKey, finalVersionName, file);

        await this.versionsRepo.createFile({
          versionId,
          fileName: fileInfo.fileName,
          fileHash: fileInfo.fileHash,
          fileSize: fileInfo.fileSize,
        });

        uploadedFiles.push({
          id: 0,
          fileName: fileInfo.fileName,
          fileHash: fileInfo.fileHash,
          hashAlgorithm: 'sha256',
          fileSize: fileInfo.fileSize,
          downloadUrl: fileInfo.downloadUrl,
        });
      }

      // Set as active version
      await this.appsRepo.setCurrentVersion(app.id, versionId);

      await auditLog.versionUpload(req, appKey, finalVersionName, uploadedFiles.length);

      return {
        message: 'Version uploaded and set as active',
        version: finalVersionName,
        files: uploadedFiles,
      };
    } catch (err) {
      this.fileStorage.cleanupTempFiles(files);
      throw err;
    }
  }

  async setActiveVersion(appKey: string, versionId: number, req: Request): Promise<void> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    const version = await this.versionsRepo.findByIdAndAppId(versionId, app.id);
    if (!version) {
      throw new VersionNotFoundError(versionId);
    }

    await this.appsRepo.setCurrentVersion(app.id, versionId);

    await auditLog.versionSetActive(req, appKey, versionId, version.version_name);
  }

  async deleteVersion(appKey: string, versionId: number, req: Request): Promise<void> {
    const app = await this.appsRepo.findByKey(appKey);
    if (!app) {
      throw new AppNotFoundError(appKey);
    }

    const version = await this.versionsRepo.findByIdAndAppId(versionId, app.id);
    if (!version) {
      throw new VersionNotFoundError(versionId);
    }

    // Prevent deleting the active version
    if (app.current_version_id === version.id) {
      throw new ValidationError(
        'Cannot delete the currently active version. Set another version as active first.'
      );
    }

    // Get files for deletion
    const files = await this.versionsRepo.findFilesByVersionId(versionId);

    // Delete from database first
    await this.versionsRepo.deleteFilesByVersionId(versionId);
    await this.versionsRepo.delete(versionId);

    // Delete files from disk
    for (const file of files) {
      await this.fileStorage.deleteFile(appKey, version.version_name, file.file_name);
    }
    await this.fileStorage.deleteVersionDirectory(appKey, version.version_name);

    await auditLog.versionDelete(req, appKey, version.version_name);
  }

  private getNextVersion(currentVersion: string | null): string {
    if (!currentVersion) return '1.0.0';

    // Strip 'v' if present for calculation
    const cleanVer = currentVersion.startsWith('v')
      ? currentVersion.substring(1)
      : currentVersion;
    const parts = cleanVer.split('.').map(Number);

    if (parts.some(isNaN)) return currentVersion + '.1';

    parts[parts.length - 1]++;
    return parts.join('.');
  }
}
