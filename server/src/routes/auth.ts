import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { validateBody, validateParams, schemas } from '../middleware/validate';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { Errors } from '../utils/responses';
import { auditLog } from '../utils/audit';
import { getDb } from '../db';
import { JwtPayload, ApiKey, Permission, toApiKeyResponse } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// Helper: Generate API key
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper: Hash API key with SHA256
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// POST /auth/login - Authenticate with API key
router.post('/login', validateBody(schemas.login), async (req, res) => {
  const { apiKey } = req.body;

  // Check if it's the bootstrap admin key
  if (ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    const payload: JwtPayload = {
      keyId: null, // Bootstrap key has no DB record
      permission: 'admin',
      appScope: null, // Global access
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    await auditLog.login(req, null, 'Bootstrap Admin Key');

    return res.json({
      token,
      expiresIn: '12h',
    });
  }

  // Look up in database
  const db = getDb();
  const keyHash = hashApiKey(apiKey);
  const dbKey = await db.get<ApiKey>(
    'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1',
    keyHash
  );

  if (!dbKey) {
    await auditLog.loginFailed(req, 'Invalid API key');
    return Errors.unauthorized(res, 'Invalid API key');
  }

  // Update last_used_at
  await db.run(
    'UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?',
    dbKey.id
  );

  const payload: JwtPayload = {
    keyId: dbKey.id,
    permission: dbKey.permission as Permission,
    appScope: dbKey.app_scope ? JSON.parse(dbKey.app_scope) : null,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

  await auditLog.login(req, dbKey.id, dbKey.name);

  return res.json({
    token,
    expiresIn: '12h',
  });
});

// GET /auth/api-keys - List all API keys (admin only)
router.get(
  '/api-keys',
  authenticateToken,
  requirePermission('admin'),
  async (req: AuthRequest, res) => {
    const db = getDb();
    const keys = await db.all<ApiKey[]>(
      `SELECT id, key_hash, name, permission, app_scope, is_active,
              created_at, last_used_at, created_by_key_id
       FROM api_keys
       ORDER BY created_at DESC`
    );

    res.json(keys.map(toApiKeyResponse));
  }
);

// POST /auth/api-keys - Create new API key (admin only)
router.post(
  '/api-keys',
  authenticateToken,
  requirePermission('admin'),
  validateBody(schemas.createApiKey),
  async (req: AuthRequest, res) => {
    const { name, permission, appScope } = req.body;
    const creatorKeyId = req.user?.keyId || null;

    const db = getDb();

    // Validate app scope if provided
    if (appScope && appScope.length > 0) {
      const placeholders = appScope.map(() => '?').join(',');
      const existingApps = await db.all(
        `SELECT app_key FROM apps WHERE app_key IN (${placeholders})`,
        ...appScope
      );
      if (existingApps.length !== appScope.length) {
        return Errors.badRequest(
          res,
          'One or more app keys in scope do not exist'
        );
      }
    }

    // Generate new key
    const newKey = generateApiKey();
    const keyHash = hashApiKey(newKey);

    const result = await db.run(
      `INSERT INTO api_keys (key_hash, name, permission, app_scope, created_by_key_id)
       VALUES (?, ?, ?, ?, ?)`,
      keyHash,
      name,
      permission,
      appScope && appScope.length > 0 ? JSON.stringify(appScope) : null,
      creatorKeyId
    );

    await auditLog.apiKeyCreate(req, result.lastID!, name, permission);

    // Return the key (only time it's visible)
    res.status(201).json({
      id: result.lastID,
      apiKey: newKey, // Only shown once!
      name,
      permission,
      appScope: appScope && appScope.length > 0 ? appScope : null,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    });
  }
);

// DELETE /auth/api-keys/:keyId - Revoke API key (admin only)
router.delete(
  '/api-keys/:keyId',
  authenticateToken,
  requirePermission('admin'),
  validateParams(schemas.apiKeyIdParam),
  async (req: AuthRequest, res) => {
    const keyId = parseInt(req.params.keyId);
    const db = getDb();

    const key = await db.get<ApiKey>('SELECT * FROM api_keys WHERE id = ?', keyId);
    if (!key) {
      return Errors.notFound(res, 'API key');
    }

    // Soft delete (set is_active = 0) - keeps audit trail
    await db.run('UPDATE api_keys SET is_active = 0 WHERE id = ?', keyId);

    await auditLog.apiKeyRevoke(req, keyId, key.name);

    res.json({ message: 'API key revoked successfully' });
  }
);

export default router;
