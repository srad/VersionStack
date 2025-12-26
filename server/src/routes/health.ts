import express from 'express';
import { getDb } from '../db';
import { Errors } from '../utils/responses';
import { getAppVersion } from '../utils/version';

const router = express.Router();

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

// GET /api/v1/health - Health check endpoint
router.get('/', async (_req, res) => {
  const startTime = Date.now();
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
    const db = getDb();
    const dbStart = Date.now();
    await db.get('SELECT 1');
    health.checks.database.latency_ms = Date.now() - dbStart;
  } catch (err: any) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'down',
      error: err.message,
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// GET /api/v1/health/live - Liveness probe (for Kubernetes)
router.get('/live', (_req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// GET /api/v1/health/ready - Readiness probe (for Kubernetes)
router.get('/ready', async (_req, res) => {
  try {
    const db = getDb();
    await db.get('SELECT 1');
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (err: any) {
    Errors.database(res);
  }
});

export default router;
