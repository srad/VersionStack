// Database Models (snake_case - matches DB columns)
export interface App {
  id: number;
  app_key: string;
  display_name: string | null;
  current_version_id: number | null;
  is_public: number; // SQLite uses 0/1
  created_at: string;
}

export interface Version {
  id: number;
  app_id: number;
  version_name: string;
  is_active: boolean;
  created_at: string;
}

export interface VersionFile {
  id: number;
  version_id: number;
  file_name: string;
  file_hash: string;
  file_size: number;
  created_at: string;
}

// Permission levels
export type Permission = 'read' | 'write' | 'admin';

// Database model for API keys (snake_case)
export interface ApiKey {
  id: number;
  key_hash: string;
  name: string;
  permission: Permission;
  app_scope: string | null; // JSON string or null for global
  is_active: number; // SQLite uses 0/1
  created_at: string;
  last_used_at: string | null;
  created_by_key_id: number | null;
}

// API Response Types (camelCase - what clients receive)
export interface AppResponse {
  id: number;
  appKey: string;
  displayName: string | null;
  currentVersionId: number | null;
  isPublic: boolean;
  createdAt: string;
}

export interface VersionFileResponse {
  id: number;
  fileName: string;
  fileHash: string;
  fileSize: number;
  hashAlgorithm: 'sha256';
  downloadUrl: string;
}

export interface VersionResponse {
  id: number;
  versionName: string;
  isActive: boolean;
  createdAt: string;
  files: VersionFileResponse[];
}

export interface LatestVersionResponse {
  version: string;
  createdAt: string;
  files: {
    fileName: string;
    hash: string;
    hashAlgorithm: 'sha256';
    size: number;
    downloadUrl: string;
  }[];
}

// API Key Response (camelCase, excludes sensitive hash)
export interface ApiKeyResponse {
  id: number;
  name: string;
  permission: Permission;
  appScope: string[] | null; // Parsed JSON array
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

// Response when creating a key (includes the actual key, shown only once)
export interface CreateApiKeyResponse extends ApiKeyResponse {
  apiKey: string; // Only shown once at creation
}

// API Request Types (camelCase)
export interface CreateAppRequest {
  appKey: string;
  displayName?: string;
}

export interface UpdateAppRequest {
  displayName?: string;
}

export interface LoginRequest {
  apiKey: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permission: Permission;
  appScope?: string[]; // Optional array of app keys
}

export interface SetActiveVersionRequest {
  versionId: number;
}

export interface UploadVersionRequest {
  versionName?: string;
}

// API Error Response
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// JWT Payload
export interface JwtPayload {
  keyId: number | null; // null for bootstrap admin key
  permission: Permission;
  appScope: string[] | null; // null = global access
  iat?: number;
  exp?: number;
}

// Express Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Helper to convert DB App to API response
export function toAppResponse(app: App): AppResponse {
  return {
    id: app.id,
    appKey: app.app_key,
    displayName: app.display_name,
    currentVersionId: app.current_version_id,
    isPublic: Boolean(app.is_public),
    createdAt: app.created_at,
  };
}

// Helper to convert DB Version to API response
export function toVersionResponse(
  version: Version,
  files: VersionFileResponse[],
  isActive: boolean
): VersionResponse {
  return {
    id: version.id,
    versionName: version.version_name,
    isActive,
    createdAt: version.created_at,
    files,
  };
}

// Helper to convert DB VersionFile to API response
export function toVersionFileResponse(
  file: VersionFile,
  appKey: string,
  versionName: string
): VersionFileResponse {
  return {
    id: file.id,
    fileName: file.file_name,
    fileHash: file.file_hash,
    fileSize: file.file_size,
    hashAlgorithm: 'sha256',
    downloadUrl: `/files/${appKey}/${versionName}/${file.file_name}`,
  };
}

// Helper to convert DB ApiKey to API response
export function toApiKeyResponse(key: ApiKey): ApiKeyResponse {
  return {
    id: key.id,
    name: key.name,
    permission: key.permission,
    appScope: key.app_scope ? JSON.parse(key.app_scope) : null,
    isActive: Boolean(key.is_active),
    createdAt: key.created_at,
    lastUsedAt: key.last_used_at,
  };
}

// Audit Log types
export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_key_id: number | null;
  actor_ip: string | null;
  details: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  actorKeyId: number | null;
  actorKeyName: string | null;
  actorIp: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export function toAuditLogResponse(log: AuditLog & { actor_key_name?: string }): AuditLogResponse {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    actorKeyId: log.actor_key_id,
    actorKeyName: log.actor_key_name || null,
    actorIp: log.actor_ip,
    details: log.details ? JSON.parse(log.details) : null,
    createdAt: log.created_at,
  };
}
