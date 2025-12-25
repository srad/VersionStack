import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Import schemas and paths to register them
import './schemas';
import './paths';

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'VersionStack API',
      version: '1.0.0',
      description:
        'A self-hosted file versioning and delivery system for managing application binaries, firmware updates, or any versioned files.\n\n' +
        '## Authentication\n' +
        'Most endpoints require JWT authentication. Obtain a token via `POST /auth/login` and include it in the `Authorization` header:\n' +
        '```\nAuthorization: Bearer <token>\n```\n\n' +
        '## API Versioning\n' +
        'The current API version is **v1**. All endpoints are prefixed with `/api/v1/`.\n' +
        'Legacy endpoints under `/api/` are deprecated and will be removed in future versions.',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1 (Current)',
      },
      {
        url: '/api',
        description: 'Legacy API (Deprecated)',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Apps', description: 'Application management' },
      { name: 'Versions', description: 'Version and file management' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
  });
}

export { registry } from './registry';
