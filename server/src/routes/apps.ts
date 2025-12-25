import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import {
  authenticateToken,
  requirePermission,
  requireAppAccess,
  AuthRequest,
} from '../middleware/auth';
import { validateBody, validateParams, schemas } from '../middleware/validate';
import { Errors } from '../utils/responses';
import { auditLog } from '../utils/audit';
import { App, toAppResponse } from '../types';

const router = express.Router();

// GET /apps - Get all apps
router.get(
  '/',
  authenticateToken,
  requirePermission('read'),
  async (req: AuthRequest, res) => {
    try {
      const db = getDb();

      // If user has app scope, filter results
      let apps: App[];
      if (req.user?.appScope && req.user.appScope.length > 0) {
        const placeholders = req.user.appScope.map(() => '?').join(',');
        apps = await db.all<App[]>(
          `SELECT * FROM apps WHERE app_key IN (${placeholders}) ORDER BY display_name`,
          ...req.user.appScope
        );
      } else {
        apps = await db.all<App[]>('SELECT * FROM apps ORDER BY display_name');
      }

      res.json(apps.map(toAppResponse));
    } catch (err: any) {
      console.error('Error fetching apps:', err);
      Errors.database(res);
    }
  }
);

// GET /apps/:appKey - Get single app
router.get(
  '/:appKey',
  authenticateToken,
  requirePermission('read'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  async (req, res) => {
    try {
      const db = getDb();
      const app = await db.get<App>(
        'SELECT * FROM apps WHERE app_key = ?',
        req.params.appKey
      );

      if (!app) {
        return Errors.appNotFound(res);
      }

      res.json(toAppResponse(app));
    } catch (err: any) {
      console.error('Error fetching app:', err);
      Errors.database(res);
    }
  }
);

// POST /apps - Create new app
router.post(
  '/',
  authenticateToken,
  requirePermission('write'),
  validateBody(schemas.createApp),
  async (req, res) => {
    const { appKey, displayName, isPublic } = req.body;

    try {
      const db = getDb();

      // Check if app already exists
      const existing = await db.get(
        'SELECT id FROM apps WHERE app_key = ?',
        appKey
      );
      if (existing) {
        return Errors.alreadyExists(res, 'App with this key');
      }

      const result = await db.run(
        'INSERT INTO apps (app_key, display_name, is_public) VALUES (?, ?, ?)',
        appKey,
        displayName || appKey,
        isPublic ? 1 : 0
      );

      await auditLog.appCreate(req, appKey, displayName || appKey);

      res.status(201).json({
        id: result.lastID,
        appKey,
        displayName: displayName || appKey,
        isPublic: Boolean(isPublic),
      });
    } catch (err: any) {
      console.error('Error creating app:', err);
      Errors.database(res);
    }
  }
);

// PUT /apps/:appKey - Update app metadata
router.put(
  '/:appKey',
  authenticateToken,
  requirePermission('write'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  validateBody(schemas.updateApp),
  async (req, res) => {
    const { appKey } = req.params;
    const { displayName, isPublic } = req.body;

    try {
      const db = getDb();

      const app = await db.get<App>(
        'SELECT * FROM apps WHERE app_key = ?',
        appKey
      );
      if (!app) {
        return Errors.appNotFound(res);
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (displayName !== undefined) {
        updates.push('display_name = ?');
        values.push(displayName);
      }
      if (isPublic !== undefined) {
        updates.push('is_public = ?');
        values.push(isPublic ? 1 : 0);
      }

      if (updates.length > 0) {
        values.push(appKey);
        await db.run(
          `UPDATE apps SET ${updates.join(', ')} WHERE app_key = ?`,
          ...values
        );

        await auditLog.appUpdate(req, appKey, { displayName, isPublic });
      }

      // Return updated app
      const updatedApp: App = {
        ...app,
        display_name: displayName !== undefined ? displayName : app.display_name,
        is_public: isPublic !== undefined ? (isPublic ? 1 : 0) : app.is_public,
      };

      res.json(toAppResponse(updatedApp));
    } catch (err: any) {
      console.error('Error updating app:', err);
      Errors.database(res);
    }
  }
);

// DELETE /apps/:appKey - Delete app and all versions
router.delete(
  '/:appKey',
  authenticateToken,
  requirePermission('write'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  async (req, res) => {
    const { appKey } = req.params;

    try {
      const db = getDb();

      const app = await db.get<App>(
        'SELECT * FROM apps WHERE app_key = ?',
        appKey
      );
      if (!app) {
        return Errors.appNotFound(res);
      }

      // Get all versions for this app to delete their files
      const versions = await db.all(
        'SELECT id, version_name FROM versions WHERE app_id = ?',
        app.id
      );

      // Delete all version files from disk
      const appFilesDir = path.join(process.cwd(), 'data/files', appKey);
      if (fs.existsSync(appFilesDir)) {
        fs.rmSync(appFilesDir, { recursive: true, force: true });
      }

      // Clear current_version_id to break app→version FK reference
      await db.run('UPDATE apps SET current_version_id = NULL WHERE id = ?', app.id);

      // Delete all version_files using subquery
      await db.run(
        'DELETE FROM version_files WHERE version_id IN (SELECT id FROM versions WHERE app_id = ?)',
        app.id
      );

      // Delete all versions
      await db.run('DELETE FROM versions WHERE app_id = ?', app.id);

      // Delete the app
      await db.run('DELETE FROM apps WHERE id = ?', app.id);

      await auditLog.appDelete(req, appKey, versions.length);

      res.json({
        message: 'App and all versions deleted successfully',
        deleted: {
          appKey,
          versionsCount: versions.length,
        },
      });
    } catch (err: any) {
      console.error('Error deleting app:', err);
      Errors.database(res);
    }
  }
);

export default router;
