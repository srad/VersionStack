import express from 'express';
import authRoutes from '../auth';
import appRoutes from '../apps';
import versionRoutes from '../versions';
import healthRoutes from '../health';
import auditRoutes from '../audit';

const router = express.Router();

// V1 API Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/apps', appRoutes);
router.use('/apps', versionRoutes); // /apps/:appKey/versions, /apps/:appKey/latest, etc.
router.use('/audit', auditRoutes);

export default router;
