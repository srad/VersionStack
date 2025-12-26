import { injectable } from 'tsyringe';
import { Response } from 'express';
import { AppsService } from '../services/apps.service';
import { AuthRequest } from '../middleware/auth';
import { BaseController } from './base.controller';

@injectable()
export class AppsController extends BaseController {
  constructor(private appsService: AppsService) {
    super();
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const apps = await this.appsService.listApps(req.user?.appScope);
      res.json(apps);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const app = await this.appsService.getApp(req.params.appKey);
      res.json(app);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appKey, displayName, isPublic } = req.body;
      const result = await this.appsService.createApp(
        {
          appKey,
          displayName: displayName || appKey,
          isPublic: Boolean(isPublic),
        },
        req
      );
      res.status(201).json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { appKey } = req.params;
      const { displayName, isPublic } = req.body;
      const result = await this.appsService.updateApp(
        appKey,
        { displayName, isPublic },
        req
      );
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await this.appsService.deleteApp(req.params.appKey, req);
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
