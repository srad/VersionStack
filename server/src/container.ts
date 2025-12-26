import 'reflect-metadata';
import { container } from 'tsyringe';
import { getDb } from './db';
import { DATABASE_TOKEN } from './repositories/base.repository';
import { FILE_STORAGE_TOKEN, FileStorage } from './storage/file-storage';

// Import repositories
import { AppsRepository } from './repositories/apps.repository';
import { VersionsRepository } from './repositories/versions.repository';
import { ApiKeysRepository } from './repositories/api-keys.repository';
import { AuditRepository } from './repositories/audit.repository';

// Import services
import { AppsService } from './services/apps.service';
import { VersionsService } from './services/versions.service';
import { AuthService } from './services/auth.service';
import { AuditService } from './services/audit.service';

// Import controllers
import { AppsController } from './controllers/apps.controller';
import { VersionsController } from './controllers/versions.controller';
import { AuthController } from './controllers/auth.controller';
import { AuditController } from './controllers/audit.controller';
import { HealthController } from './controllers/health.controller';
import { StatsController } from './controllers/stats.controller';

export function initializeContainer(): void {
  // Register database instance
  container.register(DATABASE_TOKEN, {
    useFactory: () => getDb(),
  });

  // Register file storage
  container.register(FILE_STORAGE_TOKEN, {
    useClass: FileStorage,
  });

  // Repositories are auto-registered via @injectable()
  // Services are auto-registered via @injectable()
  // Controllers are auto-registered via @injectable()
}

// Helper to get controllers
export function getControllers() {
  return {
    apps: container.resolve(AppsController),
    versions: container.resolve(VersionsController),
    auth: container.resolve(AuthController),
    audit: container.resolve(AuditController),
    health: container.resolve(HealthController),
    stats: container.resolve(StatsController),
  };
}

export { container };
