import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { initDb } from './db';
import { swaggerSpec } from './swagger';

import v1Routes from './routes/v1';
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

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'VersionStack API Docs',
}));

// OpenAPI JSON endpoint
app.get('/api/openapi.json', (_req, res) => {
  res.json(swaggerSpec);
});

// Versioned API Routes (current)
app.use('/api/v1', v1Routes);

// Legacy routes (deprecated) - maintain backward compatibility
const deprecationWarning = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Wed, 01 Jan 2026 00:00:00 GMT');
  res.setHeader('Link', '</api/v1>; rel="successor-version"');
  console.warn(`[DEPRECATED] Unversioned API call: ${req.method} ${req.originalUrl} - Please use /api/v1 prefix`);
  next();
};

app.use('/api/auth', deprecationWarning, authRoutes);
app.use('/api/apps', deprecationWarning, appRoutes);
app.use('/api/apps', deprecationWarning, versionRoutes);

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
