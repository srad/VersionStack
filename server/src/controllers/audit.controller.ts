import { injectable } from 'tsyringe';
import { Response } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth';
import { BaseController } from './base.controller';

@injectable()
export class AuditController extends BaseController {
  constructor(private auditService: AuditService) {
    super();
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { action, entityType, entityId, limit = '100', offset = '0' } = req.query;

      const result = await this.auditService.listAuditLogs(
        {
          action: action as string | undefined,
          entityType: entityType as string | undefined,
          entityId: entityId as string | undefined,
        },
        {
          limit: parseInt(limit as string) || 100,
          offset: parseInt(offset as string) || 0,
        }
      );

      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
