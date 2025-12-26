import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { BaseController } from './base.controller';

@injectable()
export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey } = req.body;
      const result = await this.authService.login(apiKey, req);
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async listApiKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      const keys = await this.authService.listApiKeys();
      res.json(keys);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async createApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, permission, appScope } = req.body;
      const creatorKeyId = req.user?.keyId || null;

      const result = await this.authService.createApiKey(
        {
          name,
          permission,
          appScope: appScope || null,
          createdByKeyId: creatorKeyId,
        },
        req
      );
      res.status(201).json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async revokeApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const keyId = parseInt(req.params.keyId);
      await this.authService.revokeApiKey(keyId, req);
      res.json({ message: 'API key revoked successfully' });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * Nginx auth_request endpoint to check file access permissions.
   * Returns 200 for allowed access, 401/403 for denied.
   */
  async checkFileAccess(req: Request, res: Response): Promise<void> {
    try {
      // Nginx passes the original URI via X-Original-URI header
      const originalUri = req.headers['x-original-uri'] as string;
      const authHeader = req.headers['authorization'] as string | undefined;

      if (!originalUri) {
        res.status(400).send('Missing X-Original-URI header');
        return;
      }

      await this.authService.checkFileAccess(originalUri, authHeader);
      res.status(200).send('OK');
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
