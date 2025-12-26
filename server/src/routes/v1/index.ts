import express from 'express';
import multer from 'multer';
import path from 'path';
import { getControllers } from '../../container';
import {
  authenticateToken,
  optionalAuth,
  requirePermission,
  requireAppAccess,
} from '../../middleware/auth';
import { validateBody, validateParams, schemas } from '../../middleware/validate';

const router = express.Router();

// Multer for file uploads
const upload = multer({
  dest: path.join(process.cwd(), 'data/tmp_uploads'),
});

export function createV1Router() {
  const { apps, versions, auth, audit, health, stats } = getControllers();

  // Health routes
  router.get('/health', (req, res) => health.health(req, res));
  router.get('/health/live', (req, res) => health.live(req, res));
  router.get('/health/ready', (req, res) => health.ready(req, res));

  // Auth routes
  router.post('/auth/login', validateBody(schemas.login), (req, res) =>
    auth.login(req, res)
  );
  // Internal endpoint for Nginx auth_request (file access check)
  router.get('/auth/file-access', (req, res) => auth.checkFileAccess(req, res));
  router.get(
    '/auth/api-keys',
    authenticateToken,
    requirePermission('admin'),
    (req, res) => auth.listApiKeys(req, res)
  );
  router.post(
    '/auth/api-keys',
    authenticateToken,
    requirePermission('admin'),
    validateBody(schemas.createApiKey),
    (req, res) => auth.createApiKey(req, res)
  );
  router.delete(
    '/auth/api-keys/:keyId',
    authenticateToken,
    requirePermission('admin'),
    validateParams(schemas.apiKeyIdParam),
    (req, res) => auth.revokeApiKey(req, res)
  );

  // Apps routes
  router.get('/apps', authenticateToken, requirePermission('read'), (req, res) =>
    apps.list(req, res)
  );
  router.get(
    '/apps/:appKey',
    authenticateToken,
    requirePermission('read'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    (req, res) => apps.get(req, res)
  );
  router.post(
    '/apps',
    authenticateToken,
    requirePermission('write'),
    validateBody(schemas.createApp),
    (req, res) => apps.create(req, res)
  );
  router.put(
    '/apps/:appKey',
    authenticateToken,
    requirePermission('write'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    validateBody(schemas.updateApp),
    (req, res) => apps.update(req, res)
  );
  router.delete(
    '/apps/:appKey',
    authenticateToken,
    requirePermission('write'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    (req, res) => apps.delete(req, res)
  );

  // Version routes
  router.get(
    '/apps/:appKey/versions',
    authenticateToken,
    requirePermission('read'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    (req, res) => versions.list(req, res)
  );
  router.post(
    '/apps/:appKey/versions',
    authenticateToken,
    requirePermission('write'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    upload.array('files'),
    (req, res) => versions.upload(req, res)
  );
  router.put(
    '/apps/:appKey/active-version',
    authenticateToken,
    requirePermission('write'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.appKeyParam),
    validateBody(schemas.setActiveVersion),
    (req, res) => versions.setActive(req, res)
  );
  router.delete(
    '/apps/:appKey/versions/:versionId',
    authenticateToken,
    requirePermission('write'),
    requireAppAccess((req) => req.params.appKey),
    validateParams(schemas.versionIdParam),
    (req, res) => versions.delete(req, res)
  );
  router.get(
    '/apps/:appKey/latest',
    optionalAuth,
    validateParams(schemas.appKeyParam),
    (req, res) => versions.getLatest(req, res)
  );

  // Audit routes
  router.get('/audit', authenticateToken, requirePermission('admin'), (req, res) =>
    audit.list(req, res)
  );

  // Stats routes
  router.get('/stats', authenticateToken, requirePermission('read'), (req, res) =>
    stats.getStats(req, res)
  );

  return router;
}

export default router;
