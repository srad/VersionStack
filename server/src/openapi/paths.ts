import { z } from 'zod';
import { registry } from './registry';
import {
  AppKeyParam,
  VersionIdParam,
  ApiKeyIdParam,
  ErrorSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  ApiKeySchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  AppSchema,
  CreateAppRequestSchema,
  UpdateAppRequestSchema,
  DeleteAppResponseSchema,
  VersionSchema,
  UploadVersionResponseSchema,
  SetActiveVersionRequestSchema,
  LatestVersionSchema,
  HealthStatusSchema,
  LivenessSchema,
  ReadinessSchema,
  MessageResponseSchema,
  AuditLogResponseSchema,
} from './schemas';

// ============ Auth Routes ============
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Authentication'],
  summary: 'Authenticate with API key and get JWT token',
  description: 'Authenticate with an API key to receive a JWT token for API access.',
  request: {
    body: {
      content: { 'application/json': { schema: LoginRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Authentication successful',
      content: { 'application/json': { schema: LoginResponseSchema } },
    },
    401: {
      description: 'Invalid API key',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// ============ API Key Management Routes ============
registry.registerPath({
  method: 'get',
  path: '/auth/api-keys',
  tags: ['API Keys'],
  summary: 'List all API keys',
  description: 'Retrieve all API keys. Requires admin permission.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of API keys',
      content: { 'application/json': { schema: z.array(ApiKeySchema) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    403: {
      description: 'Insufficient permissions',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/api-keys',
  tags: ['API Keys'],
  summary: 'Create a new API key',
  description:
    'Create a new API key with specified permissions. The key is shown only once in the response. Requires admin permission.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateApiKeyRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'API key created successfully',
      content: { 'application/json': { schema: CreateApiKeyResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    403: {
      description: 'Insufficient permissions',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/auth/api-keys/{keyId}',
  tags: ['API Keys'],
  summary: 'Revoke an API key',
  description: 'Revoke (soft-delete) an API key. Requires admin permission.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ keyId: ApiKeyIdParam }),
  },
  responses: {
    200: {
      description: 'API key revoked successfully',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    403: {
      description: 'Insufficient permissions',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'API key not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// ============ App Routes ============
registry.registerPath({
  method: 'get',
  path: '/apps',
  tags: ['Apps'],
  summary: 'List all applications',
  description: 'Retrieve a list of all registered applications.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of applications',
      content: { 'application/json': { schema: z.array(AppSchema) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/apps/{appKey}',
  tags: ['Apps'],
  summary: 'Get application details',
  description: 'Retrieve details of a specific application by its key.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
  },
  responses: {
    200: {
      description: 'Application details',
      content: { 'application/json': { schema: AppSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/apps',
  tags: ['Apps'],
  summary: 'Create a new application',
  description: 'Register a new application in the system.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateAppRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Application created successfully',
      content: { 'application/json': { schema: AppSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    409: {
      description: 'Application already exists',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/apps/{appKey}',
  tags: ['Apps'],
  summary: 'Update application metadata',
  description: 'Update the display name of an existing application.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
    body: {
      content: { 'application/json': { schema: UpdateAppRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Application updated successfully',
      content: { 'application/json': { schema: AppSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/apps/{appKey}',
  tags: ['Apps'],
  summary: 'Delete application',
  description: 'Delete an application and all its versions and files.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
  },
  responses: {
    200: {
      description: 'Application deleted successfully',
      content: { 'application/json': { schema: DeleteAppResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// ============ Version Routes ============
registry.registerPath({
  method: 'get',
  path: '/apps/{appKey}/versions',
  tags: ['Versions'],
  summary: 'List all versions',
  description: 'Retrieve all versions for an application with their files.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
  },
  responses: {
    200: {
      description: 'List of versions',
      content: { 'application/json': { schema: z.array(VersionSchema) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/apps/{appKey}/versions',
  tags: ['Versions'],
  summary: 'Upload new version',
  description: 'Upload one or more files as a new version. Automatically sets as active version.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            files: z.array(z.string().openapi({ format: 'binary' })).openapi({ description: 'Files to upload' }),
            versionName: z
              .string()
              .optional()
              .openapi({ description: 'Version name (auto-generated if not provided)' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Version uploaded successfully',
      content: { 'application/json': { schema: UploadVersionResponseSchema } },
    },
    400: {
      description: 'Validation error or no files provided',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    409: {
      description: 'Version already exists',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/apps/{appKey}/active-version',
  tags: ['Versions'],
  summary: 'Set active version',
  description: 'Set a specific version as the active (current) version for the application.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ appKey: AppKeyParam }),
    body: {
      content: { 'application/json': { schema: SetActiveVersionRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Active version updated successfully',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App or version not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/apps/{appKey}/versions/{versionId}',
  tags: ['Versions'],
  summary: 'Delete version',
  description: 'Delete a specific version and its files. Cannot delete the active version.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      appKey: AppKeyParam,
      versionId: VersionIdParam,
    }),
  },
  responses: {
    200: {
      description: 'Version deleted successfully',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    400: {
      description: 'Cannot delete active version',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    404: {
      description: 'App or version not found',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/apps/{appKey}/latest',
  tags: ['Versions'],
  summary: 'Get latest (active) version',
  description:
    'Public endpoint to get the currently active version for an application. Used by clients/devices to check for updates.',
  request: {
    params: z.object({ appKey: AppKeyParam }),
  },
  responses: {
    200: {
      description: 'Latest version information',
      content: { 'application/json': { schema: LatestVersionSchema } },
    },
    404: {
      description: 'App not found or no versions available',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// ============ Health Routes ============
registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Full health status',
  description: 'Get comprehensive health status including database connectivity.',
  responses: {
    200: {
      description: 'System is healthy',
      content: { 'application/json': { schema: HealthStatusSchema } },
    },
    503: {
      description: 'System is unhealthy',
      content: { 'application/json': { schema: HealthStatusSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health/live',
  tags: ['Health'],
  summary: 'Liveness probe',
  description: 'Kubernetes liveness probe - checks if the application is running.',
  responses: {
    200: {
      description: 'Application is alive',
      content: { 'application/json': { schema: LivenessSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  tags: ['Health'],
  summary: 'Readiness probe',
  description: 'Kubernetes readiness probe - checks if the application can serve traffic.',
  responses: {
    200: {
      description: 'Application is ready',
      content: { 'application/json': { schema: ReadinessSchema } },
    },
    503: {
      description: 'Application is not ready',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// ============ Audit Routes ============
registry.registerPath({
  method: 'get',
  path: '/audit',
  tags: ['Audit'],
  summary: 'Get audit log',
  description: 'Retrieve audit log entries for security monitoring. Admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      action: z.string().optional().openapi({
        example: 'app.create',
        description: 'Filter by action type',
      }),
      entityType: z.string().optional().openapi({
        example: 'app',
        description: 'Filter by entity type (app, version, api_key, auth)',
      }),
      entityId: z.string().optional().openapi({
        example: 'my-app',
        description: 'Filter by entity ID',
      }),
      limit: z.string().optional().openapi({
        example: '25',
        description: 'Number of entries to return (default: 100)',
      }),
      offset: z.string().optional().openapi({
        example: '0',
        description: 'Offset for pagination (default: 0)',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Audit log entries',
      content: { 'application/json': { schema: AuditLogResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    403: {
      description: 'Admin permission required',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});
