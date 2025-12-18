# VersionStack Server

A lightweight, self-hosted file delivery server optimized for versioned application assets. Built with Node.js, SQLite, and Nginx.

## Architecture

*   **Backend:** Node.js (Express + TypeScript)
*   **Database:** SQLite (stored in `data/registry.db`)
*   **File Delivery:** Nginx (serves files from `data/files` directly)
*   **Authentication:** JWT-based auth with a simple admin dashboard.

## Quick Start (Docker)

1.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the Dashboard:**
    Open `http://localhost` in your browser.

3.  **Default User:**
    *   **Register a new user:** The dashboard has a "Register (Dev Only)" button. Use it to create your first admin account. 
    *   *Note: In a production environment, disable the register route or secure it.*

## Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Dev Server:**
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

## API Usage

### 1. Login
`POST /api/auth/login`
```json
{ "username": "admin", "password": "password" }
```
Response: `{ "token": "..." }`

### 2. Create App
`POST /api/apps` (Requires Auth Header: `Authorization: Bearer <token>`)
```json
{ "app_key": "my-model", "display_name": "Face Detection Model" }
```

### 3. Upload Version
`POST /api/apps/:appKey/versions` (Requires Auth)
*   Form Data:
    *   `version_name`: "v1.0.0"
    *   `file`: (The file content)

### 4. Get Latest Version (Device Endpoint)
`GET /api/apps/:appKey/latest`
Response:
```json
{
  "version": "v1.0.0",
  "hash": "sha256-hash...",
  "download_url": "/files/my-model/v1.0.0/model.bin"
}
```

## Security Note

*   **Rate Limiting:** Enabled (100 requests / 15 min per IP).
*   **JWT Secret:** Change `JWT_SECRET` in `docker-compose.yml` or `.env` for production.
