import { Request } from 'express';
import { getDb } from '../db';
import { AuthRequest } from '../middleware/auth';

// Audit action types
export type AuditAction =
  // Auth actions
  | 'auth.login'
  | 'auth.login_failed'
  | 'api_key.create'
  | 'api_key.revoke'
  // App actions
  | 'app.create'
  | 'app.update'
  | 'app.delete'
  // Version actions
  | 'version.upload'
  | 'version.delete'
  | 'version.set_active';

export type EntityType = 'api_key' | 'app' | 'version' | 'auth';

export interface AuditEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string | number;
  details?: Record<string, unknown>;
}

/**
 * Log an action to the audit trail
 */
export async function audit(
  req: Request | AuthRequest,
  entry: AuditEntry
): Promise<void> {
  const db = getDb();
  const authReq = req as AuthRequest;

  // Get actor info from JWT if available
  const actorKeyId = authReq.user?.keyId || null;

  // Get IP address
  const ip = req.ip || req.socket?.remoteAddress || null;

  // Serialize details to JSON
  const detailsJson = entry.details ? JSON.stringify(entry.details) : null;

  try {
    await db.run(
      `INSERT INTO audit_log (action, entity_type, entity_id, actor_key_id, actor_ip, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      entry.action,
      entry.entityType,
      entry.entityId?.toString() || null,
      actorKeyId,
      ip,
      detailsJson
    );
  } catch (err) {
    // Log error but don't fail the request
    console.error('Failed to write audit log:', err);
  }
}

/**
 * Convenience function for logging with common patterns
 */
export const auditLog = {
  // Auth
  login: (req: Request, keyId: number | null, keyName?: string) =>
    audit(req, {
      action: 'auth.login',
      entityType: 'auth',
      entityId: keyId || 'bootstrap',
      details: { keyName },
    }),

  loginFailed: (req: Request, reason: string) =>
    audit(req, {
      action: 'auth.login_failed',
      entityType: 'auth',
      details: { reason },
    }),

  // API Keys
  apiKeyCreate: (req: Request, keyId: number, name: string, permission: string) =>
    audit(req, {
      action: 'api_key.create',
      entityType: 'api_key',
      entityId: keyId,
      details: { name, permission },
    }),

  apiKeyRevoke: (req: Request, keyId: number, keyName?: string) =>
    audit(req, {
      action: 'api_key.revoke',
      entityType: 'api_key',
      entityId: keyId,
      details: { keyName },
    }),

  // Apps
  appCreate: (req: Request, appKey: string, displayName?: string) =>
    audit(req, {
      action: 'app.create',
      entityType: 'app',
      entityId: appKey,
      details: { displayName },
    }),

  appUpdate: (req: Request, appKey: string, changes: Record<string, unknown>) =>
    audit(req, {
      action: 'app.update',
      entityType: 'app',
      entityId: appKey,
      details: { changes },
    }),

  appDelete: (req: Request, appKey: string, versionsCount: number) =>
    audit(req, {
      action: 'app.delete',
      entityType: 'app',
      entityId: appKey,
      details: { versionsCount },
    }),

  // Versions
  versionUpload: (req: Request, appKey: string, versionName: string, filesCount: number) =>
    audit(req, {
      action: 'version.upload',
      entityType: 'version',
      entityId: `${appKey}/${versionName}`,
      details: { appKey, versionName, filesCount },
    }),

  versionDelete: (req: Request, appKey: string, versionName: string) =>
    audit(req, {
      action: 'version.delete',
      entityType: 'version',
      entityId: `${appKey}/${versionName}`,
      details: { appKey, versionName },
    }),

  versionSetActive: (req: Request, appKey: string, versionId: number, versionName: string) =>
    audit(req, {
      action: 'version.set_active',
      entityType: 'version',
      entityId: `${appKey}/${versionName}`,
      details: { appKey, versionId, versionName },
    }),
};
