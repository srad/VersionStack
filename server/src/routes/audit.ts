import express from 'express';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { getDb } from '../db';
import { AuditLog, toAuditLogResponse } from '../types';

const router = express.Router();

// GET /audit - Get audit log (admin only)
router.get(
  '/',
  authenticateToken,
  requirePermission('admin'),
  async (req: AuthRequest, res) => {
    const db = getDb();

    // Query parameters for filtering
    const { action, entityType, entityId, limit = '100', offset = '0' } = req.query;

    let query = `
      SELECT
        audit_log.*,
        api_keys.name as actor_key_name
      FROM audit_log
      LEFT JOIN api_keys ON audit_log.actor_key_id = api_keys.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (action) {
      query += ' AND audit_log.action = ?';
      params.push(action as string);
    }

    if (entityType) {
      query += ' AND audit_log.entity_type = ?';
      params.push(entityType as string);
    }

    if (entityId) {
      query += ' AND audit_log.entity_id = ?';
      params.push(entityId as string);
    }

    query += ' ORDER BY audit_log.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string) || 100);
    params.push(parseInt(offset as string) || 0);

    try {
      const logs = await db.all<(AuditLog & { actor_key_name?: string })[]>(query, ...params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
      const countParams: string[] = [];

      if (action) {
        countQuery += ' AND action = ?';
        countParams.push(action as string);
      }
      if (entityType) {
        countQuery += ' AND entity_type = ?';
        countParams.push(entityType as string);
      }
      if (entityId) {
        countQuery += ' AND entity_id = ?';
        countParams.push(entityId as string);
      }

      const countResult = await db.get<{ total: number }>(countQuery, ...countParams);

      res.json({
        data: logs.map(toAuditLogResponse),
        pagination: {
          total: countResult?.total || 0,
          limit: parseInt(limit as string) || 100,
          offset: parseInt(offset as string) || 0,
        },
      });
    } catch (err: any) {
      console.error('Error fetching audit log:', err);
      res.status(500).json({ code: 'DATABASE_ERROR', message: 'Failed to fetch audit log' });
    }
  }
);

export default router;
