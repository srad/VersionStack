import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { Database } from 'sqlite';
import { DATABASE_TOKEN } from '../repositories/base.repository';
import { BaseController } from './base.controller';
import { getAppVersion } from '../utils/version';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latency_ms?: number;
      error?: string;
    };
  };
}

@injectable()
export class HealthController extends BaseController {
  constructor(@inject(DATABASE_TOKEN) private db: Database) {
    super();
  }

  async health(_req: Request, res: Response): Promise<void> {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: getAppVersion(),
      checks: {
        database: {
          status: 'up',
        },
      },
    };

    // Check database connectivity
    try {
      const dbStart = Date.now();
      await this.db.get('SELECT 1');
      health.checks.database.latency_ms = Date.now() - dbStart;
    } catch (err: unknown) {
      health.status = 'unhealthy';
      health.checks.database = {
        status: 'down',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  }

  live(_req: Request, res: Response): void {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
  }

  async ready(_req: Request, res: Response): Promise<void> {
    try {
      await this.db.get('SELECT 1');
      res.json({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
