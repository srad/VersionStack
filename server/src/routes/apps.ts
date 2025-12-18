import express from 'express';
import { getDb } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all apps
router.get('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const apps = await db.all('SELECT * FROM apps ORDER BY display_name');
  res.json(apps);
});

// Create new app
router.post('/', authenticateToken, async (req, res) => {
  console.log('Received Create App Request:', req.body);
  const { app_key, display_name } = req.body;
  if (!app_key) {
    return res.status(400).json({ message: 'App Key is required' });
  }

  const db = getDb();
  try {
    const result = await db.run(
      'INSERT INTO apps (app_key, display_name) VALUES (?, ?)',
      app_key,
      display_name || app_key
    );
    res.status(201).json({ id: result.lastID, app_key, display_name });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating app', error: err.message });
  }
});

export default router;
