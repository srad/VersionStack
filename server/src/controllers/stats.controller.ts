import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { StatsService } from '../services/stats.service';

@injectable()
export class StatsController extends BaseController {
  constructor(private statsService: StatsService) {
    super();
  }

  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.statsService.getDashboardStats();
      res.json(stats);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
