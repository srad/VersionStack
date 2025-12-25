# VersionStack

A self-hosted file versioning and delivery system for managing application binaries, firmware updates, or any versioned files with a REST API.

## Project Structure

```
VersionStack/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── db.ts          # Database exports (backwards compat)
│   │   ├── db/            # Database module
│   │   │   ├── index.ts   # Database initialization
│   │   │   ├── migrator.ts # Umzug migration runner
│   │   │   ├── cli.ts     # Migration CLI
│   │   │   └── migrations/ # Migration files
│   │   ├── types/         # TypeScript interfaces
│   │   ├── middleware/    # Express middleware (auth, validation)
│   │   ├── routes/        # API route handlers
│   │   │   ├── v1/        # Versioned API router
│   │   │   ├── apps.ts    # App CRUD operations
│   │   │   ├── versions.ts # Version/file upload operations
│   │   │   ├── auth.ts    # Authentication & API key management
│   │   │   ├── audit.ts   # Audit log endpoint
│   │   │   └── health.ts  # Health check endpoints
│   │   ├── openapi/       # OpenAPI documentation
│   │   │   ├── index.ts   # OpenAPI generator
│   │   │   ├── registry.ts # OpenAPI registry
│   │   │   ├── schemas.ts # Zod schemas with OpenAPI extensions
│   │   │   └── paths.ts   # API path definitions
│   │   └── utils/         # Utility functions (responses, audit)
│   ├── data/              # Runtime data (SQLite DB, uploaded files)
│   └── Dockerfile
├── client/                 # Vue 3 frontend
│   ├── src/
│   │   ├── views/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── api/           # API client layer
│   │       ├── index.ts   # API wrapper with auth interceptors
│   │       └── generated/ # Auto-generated TypeScript client
│   └── Dockerfile
├── nginx/                  # Nginx reverse proxy config
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── generate-api-client.bat # Script to regenerate API client
```

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (via `sqlite3` + `sqlite`)
- **Validation**: Zod
- **API Documentation**: OpenAPI 3.0 via `@asteasolutions/zod-to-openapi`
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer

### Frontend
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **HTTP Client**: Generated TypeScript/Axios client from OpenAPI
- **Styling**: Bootstrap 5

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (serves static files, proxies API)

## API Documentation

Interactive API documentation is available via Swagger UI:
- **Swagger UI**: `/api/docs` - Interactive API explorer
- **OpenAPI JSON**: `/api/openapi.json` - OpenAPI 3.0 specification

### Generated API Client

The frontend uses a TypeScript client auto-generated from the OpenAPI specification.

**Regenerating the client:**
```bash
# Windows
generate-api-client.bat

# What it does:
# 1. Starts backend + nginx containers
# 2. Waits for API to be ready
# 3. Downloads OpenAPI spec
# 4. Generates TypeScript/Axios client to client/src/api/generated/
# 5. Stops containers
```

**Using the client in Vue components:**
```typescript
import { appsApi, versionsApi, authApi, type App, type Version } from '../api';

// List apps
const response = await appsApi().appsGet();
const apps: App[] = response.data;

// Create app
await appsApi().appsPost({ appKey: 'my-app', displayName: 'My App' });

// Get versions
const versions = await versionsApi().appsAppKeyVersionsGet('my-app');

// Login with API key
const loginRes = await authApi().authLoginPost({ apiKey: 'your-api-key' });
localStorage.setItem('token', loginRes.data.token);
```

**For file uploads with progress tracking**, use the axios instance directly:
```typescript
import { axiosInstance } from '../api';

await axiosInstance.post(`/api/v1/apps/${appKey}/versions`, formData, {
  onUploadProgress: (e) => console.log(`${Math.round(e.loaded * 100 / e.total!)}%`)
});
```

## API Structure

All API endpoints are versioned under `/api/v1/`. Legacy unversioned endpoints (`/api/`) are deprecated.

### Authentication
- `POST /api/v1/auth/login` - Authenticate with API key, get JWT token

### API Keys (admin only)
- `GET /api/v1/auth/api-keys` - List all API keys
- `POST /api/v1/auth/api-keys` - Create new API key
- `DELETE /api/v1/auth/api-keys/:keyId` - Revoke API key

### Apps
- `GET /api/v1/apps` - List all apps
- `GET /api/v1/apps/:appKey` - Get single app
- `POST /api/v1/apps` - Create app
- `PUT /api/v1/apps/:appKey` - Update app display name
- `DELETE /api/v1/apps/:appKey` - Delete app and all versions

### Versions
- `GET /api/v1/apps/:appKey/versions` - List all versions
- `POST /api/v1/apps/:appKey/versions` - Upload new version (multipart, supports multiple files)
- `DELETE /api/v1/apps/:appKey/versions/:versionId` - Delete version
- `PUT /api/v1/apps/:appKey/active-version` - Set active version
- `GET /api/v1/apps/:appKey/latest` - Get active version info (public for public apps, auth required for private apps)

### Audit (admin only)
- `GET /api/v1/audit` - Get audit log with optional filters (?action=, ?entityType=, ?entityId=, ?limit=, ?offset=)

### Health
- `GET /api/v1/health` - Full health status
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/ready` - Readiness probe

## Database Schema

```sql
-- Apps table
apps (
  id INTEGER PRIMARY KEY,
  app_key TEXT UNIQUE NOT NULL,      -- URL-safe identifier (alphanumeric + dashes)
  display_name TEXT,
  current_version_id INTEGER,         -- Active version FK
  is_public INTEGER DEFAULT 0,        -- 1 = /latest is public, 0 = requires auth
  created_at DATETIME
)

-- Versions table
versions (
  id INTEGER PRIMARY KEY,
  app_id INTEGER NOT NULL,
  version_name TEXT NOT NULL,         -- e.g., "1.0.0"
  is_active BOOLEAN,
  created_at DATETIME
)

-- Version files table (supports multiple files per version)
version_files (
  id INTEGER PRIMARY KEY,
  version_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,            -- SHA256 hash
  file_size INTEGER NOT NULL,
  created_at DATETIME
)

-- API keys table
api_keys (
  id INTEGER PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,      -- SHA256 hash of the API key
  name TEXT NOT NULL,                 -- Human-readable label
  permission TEXT NOT NULL,           -- 'read', 'write', or 'admin'
  app_scope TEXT,                     -- NULL=global, or JSON array of app_keys
  is_active INTEGER DEFAULT 1,
  created_at DATETIME,
  last_used_at DATETIME,
  created_by_key_id INTEGER           -- FK to api_keys.id (NULL for bootstrap)
)

-- Audit log table
audit_log (
  id INTEGER PRIMARY KEY,
  action TEXT NOT NULL,               -- e.g., 'app.create', 'auth.login_failed'
  entity_type TEXT NOT NULL,          -- 'app', 'version', 'api_key', 'auth'
  entity_id TEXT,                     -- Identifier of affected entity
  actor_key_id INTEGER,               -- FK to api_keys.id (NULL for bootstrap admin)
  actor_ip TEXT,                      -- IP address of request
  details TEXT,                       -- JSON with additional context
  created_at DATETIME
)
```

## Key Conventions

### App Key Format
- Must be alphanumeric characters separated by dashes
- Valid: `my-app`, `app123`, `my-app-v2`
- Invalid: `my_app`, `my app`, `-myapp`, `myapp-`

### API Response Format
Responses return data directly without wrappers. HTTP status codes indicate success/failure.
All API responses and requests use **camelCase** for property names.

```json
// Success (200, 201)
{ "id": 1, "appKey": "my-app", "displayName": "My App", ... }

// Error (4xx, 5xx)
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": { "field": ["error1"] }  // optional, for validation errors
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - No/invalid token or API key
- `FORBIDDEN` - Insufficient permissions
- `APP_NOT_FOUND` - App doesn't exist
- `VERSION_NOT_FOUND` - Version doesn't exist
- `ALREADY_EXISTS` - Resource already exists
- `CONFLICT` - Operation conflict

## Development

### Running Locally
```bash
# Start all services
docker-compose up --build

# Access
# - Frontend: http://localhost
# - API: http://localhost/api/v1/
# - API Docs: http://localhost/api/docs
```

### Environment Variables
```env
PORT=3000
JWT_SECRET=your-secret-key
ADMIN_API_KEY=your-admin-api-key   # Bootstrap admin key (generate with: openssl rand -hex 32)
```

### Rebuilding After Dependency Changes
```bash
# Remove volumes to clear cached node_modules
docker-compose down -v
docker-compose up --build
```

## Database Migrations

Migrations are managed with **umzug** and stored in `server/src/db/migrations/`.

### Migration Commands
```bash
# Run all pending migrations (also runs automatically on server start)
npm run migrate

# Revert the last migration
npm run migrate:down

# Show migration status
npm run migrate:status

# Create a new migration
npm run migrate:create <name>
```

### Migration File Structure
```
server/src/db/migrations/
├── 001_initial_schema.ts           # Apps and versions tables
├── 002_version_files_table.ts      # Multi-file support
├── 003_add_indexes.ts              # Performance indexes
├── 004_remove_legacy_file_columns.ts # Schema cleanup
├── 005_api_keys_table.ts           # API keys for authentication
├── 006_add_app_public_flag.ts      # Public/private flag for apps
└── 007_audit_log_table.ts          # Audit trail for security monitoring
```

### Creating a New Migration
```bash
npm run migrate:create add_user_table
# Creates: src/db/migrations/1703520000000_add_user_table.ts
```

### Migration Template
```typescript
import { Database } from 'sqlite';

interface MigrationContext {
  db: Database;
}

export async function up({ db }: MigrationContext): Promise<void> {
  await db.exec(`
    CREATE TABLE example (id INTEGER PRIMARY KEY);
  `);
}

export async function down({ db }: MigrationContext): Promise<void> {
  await db.exec(`DROP TABLE IF EXISTS example`);
}
```

## File Storage

Uploaded files are stored at:
```
data/files/{appKey}/{versionName}/{fileName}
```

Files are served directly by Nginx at `/files/...` for efficient static file delivery.

## Security Features

- **API Key Authentication**: Bootstrap admin key via env var, additional keys stored in database
- **Permission Levels**:
  - `read`: GET endpoints only
  - `write`: Full CRUD on apps/versions
  - `admin`: Full access + API key management + audit log
- **App Scoping**: API keys can be limited to specific apps
- **Public/Private Apps**: Apps can be marked public (unauthenticated /latest access) or private
- **Audit Logging**: All actions are logged with actor, IP, timestamp, and details:
  - `auth.login`, `auth.login_failed`
  - `api_key.create`, `api_key.revoke`
  - `app.create`, `app.update`, `app.delete`
  - `version.upload`, `version.delete`, `version.set_active`
- JWT tokens for session management (12h expiry)
- Input validation with Zod schemas
- Input sanitization (XSS prevention, filename sanitization)
- Rate limiting (100 requests per 15 minutes per IP)
- App key validation (alphanumeric + dashes only)
- SHA256 file hashing for integrity verification
- API keys stored as SHA256 hashes (never plaintext)
