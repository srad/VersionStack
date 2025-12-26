import { injectable } from 'tsyringe';
import { Response } from 'express';
import { VersionsService } from '../services/versions.service';
import { AuthRequest } from '../middleware/auth';
import { BaseController } from './base.controller';
import { UploadedFile } from '../storage/file-storage';
import { sanitize } from '../middleware/validate';

@injectable()
export class VersionsController extends BaseController {
  constructor(private versionsService: VersionsService) {
    super();
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const versions = await this.versionsService.listVersions(req.params.appKey);
      res.json(versions);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async getLatest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const latest = await this.versionsService.getLatestVersion(
        req.params.appKey,
        req.user
      );
      res.json(latest);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appKey } = req.params;
      let { versionName } = req.body;
      const files = req.files as Express.Multer.File[];

      // Sanitize version name if provided
      if (versionName) {
        versionName = sanitize.versionName(versionName);
      }

      // Convert Multer files to UploadedFile format
      const uploadedFiles: UploadedFile[] = files.map((f) => ({
        path: f.path,
        originalname: f.originalname,
        size: f.size,
      }));

      const result = await this.versionsService.uploadVersion(
        appKey,
        versionName,
        uploadedFiles,
        req
      );
      res.status(201).json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async setActive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appKey } = req.params;
      const { versionId } = req.body;
      await this.versionsService.setActiveVersion(appKey, versionId, req);
      res.json({ message: 'Active version updated successfully' });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appKey, versionId } = req.params;
      await this.versionsService.deleteVersion(appKey, parseInt(versionId), req);
      res.json({ message: 'Version deleted successfully' });
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
