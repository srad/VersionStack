import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

const upload = multer({
  dest: path.join(process.cwd(), 'data/tmp_uploads')
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

// POST /api/apps/:appKey/versions - Upload
router.post('/:appKey/versions', authenticateToken, upload.single('file'), async (req: any, res: any) => {
  const { appKey } = req.params;
  let { version_name } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'File is required' });

  const db = getDb();
  
  try {
    const app = await db.get('SELECT id FROM apps WHERE app_key = ?', appKey);
    if (!app) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ message: 'App not found' });
    }

    if (!version_name) {
        const lastVer = await db.get(
            'SELECT version_name FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1',
            app.id
        );
        version_name = getNextVersion(lastVer ? lastVer.version_name : null);
    }

    const existing = await db.get(
        'SELECT id FROM versions WHERE app_id = ? AND version_name = ?',
        app.id, version_name
    );
    if (existing) {
        fs.unlinkSync(file.path);
        return res.status(409).json({ message: `Version ${version_name} already exists.` });
    }

    const fileHash = await calculateHash(file.path);
    const targetDir = path.join(process.cwd(), 'data/files', appKey, version_name);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, file.originalname);
    fs.renameSync(file.path, targetPath);

    const result = await db.run(
      `INSERT INTO versions (app_id, version_name, file_name, file_hash, file_size, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      app.id, version_name, file.originalname, fileHash, file.size
    );
    
    // Automatically set as active version
    await db.run('UPDATE apps SET current_version_id = ? WHERE id = ?', result.lastID, app.id);

    res.status(201).json({ 
      message: 'Version uploaded and set as active',
      version: version_name, 
      hash: fileHash,
      hash_algorithm: 'sha256',
      path: `/files/${appKey}/${version_name}/${file.originalname}` 
    });

  } catch (err: any) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    console.error(err);
    res.status(500).json({ message: 'Error processing upload', error: err.message });
  }
});

// PUT /api/apps/:appKey/active-version - Set Active Version
router.put('/:appKey/active-version', authenticateToken, async (req: any, res: any) => {
    const { appKey } = req.params;
    const { version_id } = req.body;

    if (!version_id) return res.status(400).json({ message: 'version_id is required' });

    const db = getDb();
    try {
        const app = await db.get('SELECT id FROM apps WHERE app_key = ?', appKey);
        if (!app) return res.status(404).json({ message: 'App not found' });

        // Verify version belongs to app
        const version = await db.get('SELECT id FROM versions WHERE id = ? AND app_id = ?', version_id, app.id);
        if (!version) return res.status(404).json({ message: 'Version not found for this app' });

        await db.run('UPDATE apps SET current_version_id = ? WHERE id = ?', version_id, app.id);
        res.json({ message: 'Active version updated successfully' });
    } catch (err: any) {
        res.status(500).json({ message: 'Error updating active version', error: err.message });
    }
});

// DELETE /api/apps/:appKey/versions/:versionId - Delete Version
router.delete('/:appKey/versions/:versionId', authenticateToken, async (req: any, res: any) => {
    const { appKey, versionId } = req.params;
    const db = getDb();

    try {
        const app = await db.get('SELECT id, current_version_id FROM apps WHERE app_key = ?', appKey);
        if (!app) return res.status(404).json({ message: 'App not found' });

        const version = await db.get('SELECT * FROM versions WHERE id = ? AND app_id = ?', versionId, app.id);
        if (!version) return res.status(404).json({ message: 'Version not found' });

        // Prevent deleting the active version
        if (app.current_version_id === version.id) {
            return res.status(400).json({ message: 'Cannot delete the currently active version. Set another version as active first.' });
        }

        // Delete file from disk
        const filePath = path.join(process.cwd(), 'data/files', appKey, version.version_name, version.file_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Cleanup directory if empty (optional but good practice)
        const versionDir = path.join(process.cwd(), 'data/files', appKey, version.version_name);
        if (fs.existsSync(versionDir) && fs.readdirSync(versionDir).length === 0) {
            fs.rmdirSync(versionDir);
        }

        // Delete from DB
        await db.run('DELETE FROM versions WHERE id = ?', versionId);

        res.json({ message: 'Version deleted successfully' });

    } catch (err: any) {
        res.status(500).json({ message: 'Error deleting version', error: err.message });
    }
});

// GET /api/apps/:appKey/versions - List All
router.get('/:appKey/versions', authenticateToken, async (req: any, res: any) => {
  const { appKey } = req.params;
  const db = getDb();

  try {
    const app = await db.get('SELECT id, current_version_id FROM apps WHERE app_key = ?', appKey);
    if (!app) return res.status(404).json({ message: 'App not found' });

    const versions = await db.all(
      `SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC`,
      app.id
    );

    const versionsWithMeta = versions.map(v => ({
        ...v,
        is_active: v.id === app.current_version_id, // Mark the active one
        hash_algorithm: 'sha256',
        download_url: `/files/${appKey}/${v.version_name}/${v.file_name}`
    }));

    res.json(versionsWithMeta);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving versions', error: err.message });
  }
});

// GET /api/apps/:appKey/latest - Get Latest (Active)
router.get('/:appKey/latest', async (req: any, res: any) => {
  const { appKey } = req.params;
  const db = getDb();

  try {
    const app = await db.get('SELECT id, current_version_id FROM apps WHERE app_key = ?', appKey);
    if (!app) return res.status(404).json({ message: 'App not found' });
    
    let latestVersion;

    if (app.current_version_id) {
        // Get the specifically active version
        latestVersion = await db.get('SELECT * FROM versions WHERE id = ?', app.current_version_id);
    } else {
        // Fallback to most recent if no active version set (legacy behavior)
        latestVersion = await db.get(
            `SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 1`, 
            app.id
        );
    }

    if (!latestVersion) return res.status(404).json({ message: 'No versions found' });

    const downloadUrl = `/files/${appKey}/${latestVersion.version_name}/${latestVersion.file_name}`;

    res.json({
      version: latestVersion.version_name,
      hash: latestVersion.file_hash,
      hash_algorithm: 'sha256',
      size: latestVersion.file_size,
      download_url: downloadUrl,
      created_at: latestVersion.created_at
    });

  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving latest version', error: err.message });
  }
});

export default router;