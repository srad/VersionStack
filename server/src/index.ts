import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { initDb } from './db';

import authRoutes from './routes/auth';
import appRoutes from './routes/apps';
import versionRoutes from './routes/versions';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required when behind Traefik/nginx)
app.set('trust proxy', 1);

// Security Middleware
// Helmet removed to debug CSP issues
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});
app.use(cors({
  origin: true, // Allow all origins (or specify: ['https://versionstack.sedrad.com'])
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/apps', versionRoutes); // Use same prefix for cleaner URL structure: /api/apps/:appKey/versions

// Ensure directories exist
const dataDirs = [
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'data/files'),
  path.join(process.cwd(), 'data/tmp_uploads')
];

dataDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Start Server
const startServer = async () => {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Increase timeouts for large file uploads (1 hour)
    server.timeout = 3600000;
    server.keepAliveTimeout = 3600000;
    server.headersTimeout = 3600000;
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
