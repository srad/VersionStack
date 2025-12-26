import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ============ Common Parameters ============
export const AppKeyParam = registry.registerParameter(
  'AppKeyParam',
  z.string().openapi({
    param: { name: 'appKey', in: 'path' },
    example: 'my-app',
    description: 'Unique application key',
  })
);

export const VersionIdParam = registry.registerParameter(
  'VersionIdParam',
  z.string().openapi({
    param: { name: 'versionId', in: 'path' },
    example: '1',
    description: 'Version ID',
  })
);

// ============ Error Schema ============
export const ErrorSchema = registry.register(
  'Error',
  z.object({
    code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
    message: z.string().openapi({ example: 'Validation failed' }),
    details: z.record(z.string(), z.array(z.string())).optional(),
  })
);

// ============ Auth Schemas ============
export const LoginRequestSchema = registry.register(
  'LoginRequest',
  z.object({
    apiKey: z.string().openapi({
      example: 'abc123def456...',
      description: 'Your API key',
    }),
  })
);

export const LoginResponseSchema = registry.register(
  'LoginResponse',
  z.object({
    token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIs...' }),
    expiresIn: z.string().openapi({ example: '12h' }),
  })
);

// ============ API Key Schemas ============
export const PermissionSchema = z.enum(['read', 'write', 'admin']);

export const ApiKeySchema = registry.register(
  'ApiKey',
  z.object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Production Server Key' }),
    permission: PermissionSchema.openapi({ example: 'write' }),
    appScope: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ['my-app', 'firmware'],
        description: 'Null for global access, or array of app keys',
      }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
    lastUsedAt: z.string().nullable().openapi({ example: '2024-01-15T12:00:00.000Z' }),
  })
);

export const CreateApiKeyRequestSchema = registry.register(
  'CreateApiKeyRequest',
  z.object({
    name: z.string().openapi({
      example: 'CI/CD Pipeline Key',
      description: 'Human-readable name for the key',
    }),
    permission: PermissionSchema.openapi({
      example: 'write',
      description: 'Permission level: read, write, or admin',
    }),
    appScope: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['my-app'],
        description: 'Limit key to specific apps (omit for global access)',
      }),
  })
);

export const CreateApiKeyResponseSchema = registry.register(
  'CreateApiKeyResponse',
  z.object({
    id: z.number().openapi({ example: 1 }),
    apiKey: z.string().openapi({
      example: 'abc123def456789...',
      description: 'The API key - shown only once at creation!',
    }),
    name: z.string().openapi({ example: 'CI/CD Pipeline Key' }),
    permission: PermissionSchema.openapi({ example: 'write' }),
    appScope: z.array(z.string()).nullable().openapi({ example: ['my-app'] }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
    lastUsedAt: z.string().nullable().openapi({ example: null }),
  })
);

export const ApiKeyIdParam = registry.registerParameter(
  'ApiKeyIdParam',
  z.string().openapi({
    param: { name: 'keyId', in: 'path' },
    example: '1',
    description: 'API Key ID',
  })
);

// ============ App Schemas ============
export const AppSchema = registry.register(
  'App',
  z.object({
    id: z.number().openapi({ example: 1 }),
    appKey: z.string().openapi({ example: 'my-app' }),
    displayName: z.string().nullable().openapi({ example: 'My Application' }),
    currentVersionId: z.number().nullable().openapi({ example: 5 }),
    isPublic: z.boolean().openapi({
      example: false,
      description: 'Whether the /latest endpoint is publicly accessible without authentication',
    }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
  })
);

export const CreateAppRequestSchema = registry.register(
  'CreateAppRequest',
  z.object({
    appKey: z
      .string()
      .regex(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/)
      .openapi({ example: 'my-app', description: 'Unique identifier (alphanumeric with dashes)' }),
    displayName: z
      .string()
      .optional()
      .openapi({ example: 'My Application', description: 'Human-readable name' }),
    isPublic: z
      .boolean()
      .optional()
      .openapi({
        example: false,
        description: 'Whether the /latest endpoint is publicly accessible (default: false)',
      }),
  })
);

export const UpdateAppRequestSchema = registry.register(
  'UpdateAppRequest',
  z.object({
    displayName: z.string().optional().openapi({ example: 'Updated App Name' }),
    isPublic: z
      .boolean()
      .optional()
      .openapi({
        example: true,
        description: 'Whether the /latest endpoint is publicly accessible',
      }),
  })
);

export const DeleteAppResponseSchema = registry.register(
  'DeleteAppResponse',
  z.object({
    message: z.string().openapi({ example: 'App and all versions deleted successfully' }),
    deleted: z.object({
      appKey: z.string().openapi({ example: 'my-app' }),
      versionsCount: z.number().openapi({ example: 3 }),
    }),
  })
);

// ============ Version File Schemas ============
export const VersionFileSchema = registry.register(
  'VersionFile',
  z.object({
    id: z.number().openapi({ example: 1 }),
    fileName: z.string().openapi({ example: 'firmware.bin' }),
    fileHash: z.string().openapi({ example: 'a1b2c3d4e5f6...' }),
    fileSize: z.number().openapi({ example: 1048576 }),
    hashAlgorithm: z.literal('sha256').openapi({ example: 'sha256' }),
    downloadUrl: z.string().openapi({ example: '/files/my-app/1.0.0/firmware.bin' }),
  })
);

// ============ Version Schemas ============
export const VersionSchema = registry.register(
  'Version',
  z.object({
    id: z.number().openapi({ example: 1 }),
    versionName: z.string().openapi({ example: '1.0.0' }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
    files: z.array(VersionFileSchema),
  })
);

export const UploadVersionResponseSchema = registry.register(
  'UploadVersionResponse',
  z.object({
    message: z.string().openapi({ example: 'Version uploaded and set as active' }),
    version: z.string().openapi({ example: '1.0.1' }),
    files: z.array(VersionFileSchema),
  })
);

export const SetActiveVersionRequestSchema = registry.register(
  'SetActiveVersionRequest',
  z.object({
    versionId: z.number().openapi({ example: 5, description: 'ID of the version to set as active' }),
  })
);

export const LatestVersionFileSchema = registry.register(
  'LatestVersionFile',
  z.object({
    fileName: z.string().openapi({ example: 'firmware.bin' }),
    hash: z.string().openapi({ example: 'a1b2c3d4e5f6...' }),
    hashAlgorithm: z.literal('sha256'),
    size: z.number().openapi({ example: 1048576 }),
    downloadUrl: z.string().openapi({ example: '/files/my-app/1.0.0/firmware.bin' }),
  })
);

export const LatestVersionSchema = registry.register(
  'LatestVersion',
  z.object({
    version: z.string().openapi({ example: '1.0.0' }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
    files: z.array(LatestVersionFileSchema),
  })
);

// ============ Health Schemas ============
export const HealthStatusSchema = registry.register(
  'HealthStatus',
  z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string(),
    uptime: z.number().openapi({ example: 3600.5 }),
    version: z.string().openapi({ example: '1.0.0' }),
    checks: z.object({
      database: z.object({
        status: z.enum(['up', 'down']),
        latency_ms: z.number().optional().openapi({ example: 5 }),
        error: z.string().optional(),
      }),
    }),
  })
);

export const LivenessSchema = registry.register(
  'Liveness',
  z.object({
    status: z.literal('alive'),
    timestamp: z.string(),
  })
);

export const ReadinessSchema = registry.register(
  'Readiness',
  z.object({
    status: z.literal('ready'),
    timestamp: z.string(),
  })
);

export const MessageResponseSchema = registry.register(
  'MessageResponse',
  z.object({
    message: z.string().openapi({ example: 'Operation completed successfully' }),
  })
);

// ============ Audit Log Schemas ============
export const AuditLogEntrySchema = registry.register(
  'AuditLogEntry',
  z.object({
    id: z.number().openapi({ example: 1 }),
    action: z.string().openapi({
      example: 'app.create',
      description: 'The action that was performed',
    }),
    entityType: z.string().openapi({
      example: 'app',
      description: 'Type of entity affected (app, version, api_key, auth)',
    }),
    entityId: z.string().nullable().openapi({
      example: 'my-app',
      description: 'Identifier of the affected entity',
    }),
    actorKeyId: z.number().nullable().openapi({
      example: 1,
      description: 'ID of the API key that performed the action (null for bootstrap admin)',
    }),
    actorKeyName: z.string().nullable().openapi({
      example: 'CI/CD Pipeline',
      description: 'Name of the API key that performed the action',
    }),
    actorIp: z.string().nullable().openapi({
      example: '192.168.1.100',
      description: 'IP address of the request',
    }),
    details: z
      .record(z.string(), z.unknown())
      .nullable()
      .openapi({
        example: { displayName: 'My App' },
        description: 'Additional details about the action',
      }),
    createdAt: z.string().openapi({ example: '2024-01-15T10:30:00.000Z' }),
  })
);

export const AuditLogPaginationSchema = registry.register(
  'AuditLogPagination',
  z.object({
    total: z.number().openapi({ example: 150 }),
    limit: z.number().openapi({ example: 25 }),
    offset: z.number().openapi({ example: 0 }),
  })
);

export const AuditLogResponseSchema = registry.register(
  'AuditLogResponse',
  z.object({
    data: z.array(AuditLogEntrySchema),
    pagination: AuditLogPaginationSchema,
  })
);

// ============ Stats Schemas ============
export const StatsSchema = registry.register(
  'Stats',
  z.object({
    totalApps: z.number().openapi({
      example: 5,
      description: 'Total number of registered applications',
    }),
    totalVersions: z.number().openapi({
      example: 42,
      description: 'Total number of versions across all applications',
    }),
    totalStorageBytes: z.number().openapi({
      example: 1073741824,
      description: 'Total storage used by all files in bytes',
    }),
    appsWithActiveVersion: z.number().openapi({
      example: 4,
      description: 'Number of applications that have an active version set',
    }),
    recentUploads: z.number().openapi({
      example: 8,
      description: 'Number of version uploads in the last 7 days',
    }),
  })
);
