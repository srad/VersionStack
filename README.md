# VersionStack

A self-hosted file versioning and delivery system for managing application binaries, firmware updates, or any versioned files with a REST API.

## Features

- **Version Management**: Upload, track, and manage multiple versions of files per application
- **Multi-file Support**: Each version can contain multiple files
- **API Key Authentication**: Secure access with permission levels (read, write, admin)
- **App Scoping**: Limit API keys to specific applications
- **Public/Private Apps**: Control whether `/latest` endpoint requires authentication
- **Audit Logging**: Track all actions with actor, IP, and timestamps
- **File Integrity**: SHA256 hashing for all uploaded files
- **OpenAPI Documentation**: Auto-generated API docs with Swagger UI

## Quick Start (Docker)

1. **Configure environment:**
   ```bash
   # Generate a secure admin API key
   openssl rand -hex 32
   ```

2. **Set environment variables** in `docker-compose.yml`:
   ```yaml
   environment:
     JWT_SECRET: your-secure-jwt-secret
     ADMIN_API_KEY: your-generated-api-key
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - **Dashboard**: http://localhost
   - **API**: http://localhost/api/v1/
   - **API Docs**: http://localhost/api/docs

5. **Login** with your `ADMIN_API_KEY` to access the dashboard.

## Architecture

```
VersionStack/
├── server/          # Node.js/Express backend (TypeScript)
├── client/          # Vue 3 frontend
├── nginx/           # Reverse proxy configuration
└── docker-compose.yml
```

- **Backend**: Node.js + Express + TypeScript + SQLite
- **Frontend**: Vue 3 + Vite + Bootstrap 5
- **Infrastructure**: Docker + Nginx

## API Usage

### Authentication

All API requests (except public endpoints) require a JWT token obtained by logging in with an API key.

```bash
# Login with API key
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "your-api-key"}'

# Response: {"token": "eyJ...", "expiresIn": "12h"}
```

Use the token in subsequent requests:
```bash
curl http://localhost/api/v1/apps \
  -H "Authorization: Bearer <token>"
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/apps` | List all apps |
| POST | `/api/v1/apps` | Create app |
| GET | `/api/v1/apps/:appKey/versions` | List versions |
| POST | `/api/v1/apps/:appKey/versions` | Upload version |
| GET | `/api/v1/apps/:appKey/latest` | Get active version (public for public apps) |
| GET | `/api/v1/stats` | Dashboard statistics |

### Example: Upload a Version

```bash
curl -X POST http://localhost/api/v1/apps/my-app/versions \
  -H "Authorization: Bearer <token>" \
  -F "files=@firmware.bin" \
  -F "versionName=1.0.0"
```

### Example: Check for Updates (Device Endpoint)

```bash
# For public apps (no auth required)
curl http://localhost/api/v1/apps/my-app/latest

# Response:
{
  "version": "1.0.0",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "files": [
    {
      "fileName": "firmware.bin",
      "hash": "a1b2c3d4...",
      "hashAlgorithm": "sha256",
      "size": 1048576,
      "downloadUrl": "/files/my-app/1.0.0/firmware.bin"
    }
  ]
}
```

## Permission Levels

| Level | Capabilities |
|-------|--------------|
| `read` | View apps, versions, download files |
| `write` | Create/update/delete apps and versions |
| `admin` | Full access + API key management + audit log |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `ADMIN_API_KEY` | Bootstrap admin API key | Yes |
| `PORT` | Server port (default: 3000) | No |

## Development

```bash
# Start all services
docker-compose up --build

# Rebuild after dependency changes
docker-compose down -v
docker-compose up --build

# Run backend tests
cd server && npm test
```

## Security

- API keys stored as SHA256 hashes
- JWT tokens with 12-hour expiry
- Rate limiting (100 requests/15 min per IP)
- Input validation with Zod
- File download protection via Nginx auth_request
- Comprehensive audit logging

## Documentation

- **API Reference**: http://localhost/api/docs (Swagger UI)
- **Developer Guide**: See [CLAUDE.md](CLAUDE.md) for detailed architecture and conventions
