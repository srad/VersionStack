import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import {
  authenticateToken,
  optionalAuth,
  requirePermission,
  requireAppAccess,
  AuthRequest,
} from '../middleware/auth';
import { validateBody, validateParams, schemas, sanitize } from '../middleware/validate';
import { Errors } from '../utils/responses';
import { auditLog } from '../utils/audit';
import { App, Version, VersionFile, VersionFileResponse, toVersionFileResponse } from '../types';

const router = express.Router();

const upload = multer({
  dest: path.join(process.cwd(), 'data/tmp_uploads'),
});

const calculateHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const getNextVersion = (currentVersion: string | null): string => {
  if (!currentVersion) return '1.0.0';

  // Strip 'v' if present for calculation
  const cleanVer = currentVersion.startsWith('v') ? currentVersion.substring(1) : currentVersion;
  const parts = cleanVer.split('.').map(Number);

  if (parts.some(isNaN)) return currentVersion + '.1';

  parts[parts.length - 1]++;
  return parts.join('.');
};

// POST /apps/:appKey/versions - Upload (supports multiple files)
router.post(
  '/:appKey/versions',
  authenticateToken,
  requirePermission('write'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  upload.array('files'),
  async (req, res) => {
    const { appKey } = req.params;
    let { versionName } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return Errors.badRequest(res, 'At least one file is required');
    }

    const db = getDb();

    // Helper to clean up temp files on error
    const cleanupTempFiles = () => {
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    };

    try {
      const app = await db.get<App>('SELECT id FROM apps WHERE app_key = ?', appKey);
      if (!app) {
        cleanupTempFiles();
        return Errors.appNotFound(res);
      }

      // Sanitize and validate version name if provided
      if (versionName) {
        versionName = sanitize.versionName(versionName);
      } else {
        const lastVer = await db.get<Version>(
          'SELECT version_name FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1',
          app.id
        );
        versionName = getNextVersion(lastVer ? lastVer.version_name : null);
      }

      const existing = await db.get(
        'SELECT id FROM versions WHERE app_id = ? AND version_name = ?',
        app.id,
        versionName
      );
      if (existing) {
        cleanupTempFiles();
        return Errors.conflict(res, `Version ${versionName} already exists`);
      }

      // Create the version record first
      const result = await db.run(
        `INSERT INTO versions (app_id, version_name, is_active) VALUES (?, ?, 1)`,
        app.id,
        versionName
      );
      const versionId = result.lastID;

      // Process and store each file
      const targetDir = path.join(process.cwd(), 'data/files', appKey, versionName);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const uploadedFiles: VersionFileResponse[] = [];
      for (const file of files) {
        const fileHash = await calculateHash(file.path);
        const sanitizedFileName = sanitize.fileName(file.originalname);
        const targetPath = path.join(targetDir, sanitizedFileName);
        fs.renameSync(file.path, targetPath);

        await db.run(
          `INSERT INTO version_files (version_id, file_name, file_hash, file_size) VALUES (?, ?, ?, ?)`,
          versionId,
          sanitizedFileName,
          fileHash,
          file.size
        );

        uploadedFiles.push({
          id: 0,
          fileName: sanitizedFileName,
          fileHash: fileHash,
          hashAlgorithm: 'sha256',
          fileSize: file.size,
          downloadUrl: `/files/${appKey}/${versionName}/${sanitizedFileName}`,
        });
      }

      // Automatically set as active version
      await db.run('UPDATE apps SET current_version_id = ? WHERE id = ?', versionId, app.id);

      await auditLog.versionUpload(req, appKey, versionName, uploadedFiles.length);

      res.status(201).json({
        message: 'Version uploaded and set as active',
        version: versionName,
        files: uploadedFiles,
      });
    } catch (err: any) {
      cleanupTempFiles();
      console.error('Error processing upload:', err);
      Errors.internal(res, 'Error processing upload');
    }
  }
);

// PUT /apps/:appKey/active-version - Set Active Version
router.put(
  '/:appKey/active-version',
  authenticateToken,
  requirePermission('write'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  validateBody(schemas.setActiveVersion),
  async (req, res) => {
    const { appKey } = req.params;
    const { versionId } = req.body;

    try {
      const db = getDb();
      const app = await db.get<App>('SELECT id FROM apps WHERE app_key = ?', appKey);
      if (!app) return Errors.appNotFound(res);

      // Verify version belongs to app
      const version = await db.get<Version>(
        'SELECT * FROM versions WHERE id = ? AND app_id = ?',
        versionId,
        app.id
      );
      if (!version) return Errors.versionNotFound(res);

      await db.run('UPDATE apps SET current_version_id = ? WHERE id = ?', versionId, app.id);

      await auditLog.versionSetActive(req, appKey, versionId, version.version_name);

      res.json({ message: 'Active version updated successfully' });
    } catch (err: any) {
      console.error('Error updating active version:', err);
      Errors.database(res);
    }
  }
);

// DELETE /apps/:appKey/versions/:versionId - Delete Version
router.delete(
  '/:appKey/versions/:versionId',
  authenticateToken,
  requirePermission('write'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.versionIdParam),
  async (req, res) => {
    const { appKey, versionId } = req.params;

    try {
      const db = getDb();
      const app = await db.get<App>(
        'SELECT id, current_version_id FROM apps WHERE app_key = ?',
        appKey
      );
      if (!app) return Errors.appNotFound(res);

      const version = await db.get<Version>(
        'SELECT * FROM versions WHERE id = ? AND app_id = ?',
        versionId,
        app.id
      );
      if (!version) return Errors.versionNotFound(res);

      // Prevent deleting the active version
      if (app.current_version_id === version.id) {
        return Errors.badRequest(
          res,
          'Cannot delete the currently active version. Set another version as active first.'
        );
      }

      // Get all files for this version
      const files = await db.all<VersionFile[]>(
        'SELECT * FROM version_files WHERE version_id = ?',
        versionId
      );

      // Delete all files from disk
      const versionDir = path.join(process.cwd(), 'data/files', appKey, version.version_name);
      for (const file of files) {
        const filePath = path.join(versionDir, file.file_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Cleanup directory if empty
      if (fs.existsSync(versionDir) && fs.readdirSync(versionDir).length === 0) {
        fs.rmdirSync(versionDir);
      }

      // Delete files from DB
      await db.run('DELETE FROM version_files WHERE version_id = ?', versionId);

      // Delete version from DB
      await db.run('DELETE FROM versions WHERE id = ?', versionId);

      await auditLog.versionDelete(req, appKey, version.version_name);

      res.json({ message: 'Version deleted successfully' });
    } catch (err: any) {
      console.error('Error deleting version:', err);
      Errors.database(res);
    }
  }
);

// GET /apps/:appKey/versions - List All
router.get(
  '/:appKey/versions',
  authenticateToken,
  requirePermission('read'),
  requireAppAccess((req) => req.params.appKey),
  validateParams(schemas.appKeyParam),
  async (req, res) => {
    const { appKey } = req.params;

    try {
      const db = getDb();
      const app = await db.get<App>(
        'SELECT id, current_version_id FROM apps WHERE app_key = ?',
        appKey
      );
      if (!app) return Errors.appNotFound(res);

      const versions = await db.all<Version[]>(
        `SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC`,
        app.id
      );

      // Fetch files for each version
      const versionsWithFiles = await Promise.all(
        versions.map(async (v) => {
          const files = await db.all<VersionFile[]>(
            `SELECT * FROM version_files WHERE version_id = ? ORDER BY file_name`,
            v.id
          );

          const filesWithMeta: VersionFileResponse[] = files.map((f) =>
            toVersionFileResponse(f, appKey, v.version_name)
          );

          return {
            id: v.id,
            versionName: v.version_name,
            isActive: v.id === app.current_version_id,
            createdAt: v.created_at,
            files: filesWithMeta,
          };
        })
      );

      res.json(versionsWithFiles);
    } catch (err: any) {
      console.error('Error retrieving versions:', err);
      Errors.database(res);
    }
  }
);

// GET /apps/:appKey/latest - Get Latest (Active) - Public for public apps, auth required for private
router.get(
  '/:appKey/latest',
  optionalAuth,
  validateParams(schemas.appKeyParam),
  async (req: AuthRequest, res) => {
    const { appKey } = req.params;

    try {
      const db = getDb();
      const app = await db.get<App>(
        'SELECT id, current_version_id, is_public FROM apps WHERE app_key = ?',
        appKey
      );
      if (!app) return Errors.appNotFound(res);

      // Check access: public apps are accessible to all, private apps require auth
      if (!app.is_public) {
        if (!req.user) {
          return Errors.unauthorized(res, 'This app requires authentication');
        }
        // Check app scope access for authenticated users
        if (
          req.user.appScope !== null &&
          req.user.permission !== 'admin' &&
          !req.user.appScope.includes(appKey)
        ) {
          return Errors.forbidden(res, `No access to app: ${appKey}`);
        }
      }

    let latestVersion: Version | undefined;

    if (app.current_version_id) {
      // Get the specifically active version
      latestVersion = await db.get<Version>(
        'SELECT * FROM versions WHERE id = ?',
        app.current_version_id
      );
    } else {
      // Fallback to most recent if no active version set (legacy behavior)
      latestVersion = await db.get<Version>(
        `SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1`,
        app.id
      );
    }

    if (!latestVersion) return Errors.notFound(res, 'No versions');

    // Fetch all files for this version
    const files = await db.all<VersionFile[]>(
      `SELECT * FROM version_files WHERE version_id = ? ORDER BY file_name`,
      latestVersion.id
    );

    const filesWithMeta = files.map((f) => ({
      fileName: f.file_name,
      hash: f.file_hash,
      hashAlgorithm: 'sha256' as const,
      size: f.file_size,
      downloadUrl: `/files/${appKey}/${latestVersion!.version_name}/${f.file_name}`,
    }));

    res.json({
      version: latestVersion.version_name,
      createdAt: latestVersion.created_at,
      files: filesWithMeta,
    });
  } catch (err: any) {
    console.error('Error retrieving latest version:', err);
    Errors.database(res);
  }
});

export default router;
