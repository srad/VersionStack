import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { ApiKeysRepository, CreateApiKeyData } from '../repositories/api-keys.repository';
import { AppsRepository } from '../repositories/apps.repository';
import { auditLog } from '../utils/audit';
import { ApiKey, JwtPayload, Permission, ApiKeyResponse, toApiKeyResponse } from '../types';
import { UnauthorizedError, NotFoundError, ValidationError } from '../errors';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export interface LoginResult {
  token: string;
  expiresIn: string;
}

export interface CreateApiKeyResult {
  id: number;
  apiKey: string;
  name: string;
  permission: Permission;
  appScope: string[] | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

@injectable()
export class AuthService {
  constructor(
    private apiKeysRepo: ApiKeysRepository,
    private appsRepo: AppsRepository
  ) {}

  async login(apiKey: string, req: Request): Promise<LoginResult> {
    // Check if it's the bootstrap admin key
    if (ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
      const payload: JwtPayload = {
        keyId: null,
        permission: 'admin',
        appScope: null,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

      await auditLog.login(req, null, 'Bootstrap Admin Key');

      return { token, expiresIn: '12h' };
    }

    // Look up in database
    const keyHash = this.apiKeysRepo.hashApiKey(apiKey);
    const dbKey = await this.apiKeysRepo.findByHash(keyHash);

    if (!dbKey) {
      await auditLog.loginFailed(req, 'Invalid API key');
      throw new UnauthorizedError('Invalid API key');
    }

    // Update last_used_at
    await this.apiKeysRepo.updateLastUsed(dbKey.id);

    const payload: JwtPayload = {
      keyId: dbKey.id,
      permission: dbKey.permission as Permission,
      appScope: dbKey.app_scope ? JSON.parse(dbKey.app_scope) : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    await auditLog.login(req, dbKey.id, dbKey.name);

    return { token, expiresIn: '12h' };
  }

  async listApiKeys(): Promise<ApiKeyResponse[]> {
    const keys = await this.apiKeysRepo.findAll();
    return keys.map(toApiKeyResponse);
  }

  async createApiKey(
    data: CreateApiKeyData,
    req: Request
  ): Promise<CreateApiKeyResult> {
    // Validate app scope if provided
    if (data.appScope && data.appScope.length > 0) {
      const existingApps = await this.appsRepo.findByScope(data.appScope);
      if (existingApps.length !== data.appScope.length) {
        throw new ValidationError('One or more app keys in scope do not exist');
      }
    }

    const { id, plainKey } = await this.apiKeysRepo.create(data);

    await auditLog.apiKeyCreate(req, id, data.name, data.permission);

    return {
      id,
      apiKey: plainKey,
      name: data.name,
      permission: data.permission,
      appScope: data.appScope && data.appScope.length > 0 ? data.appScope : null,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
  }

  async revokeApiKey(keyId: number, req: Request): Promise<void> {
    const key = await this.apiKeysRepo.findById(keyId);
    if (!key) {
      throw new NotFoundError('API key');
    }

    await this.apiKeysRepo.revoke(keyId);

    await auditLog.apiKeyRevoke(req, keyId, key.name);
  }

  /**
   * Check if file access is allowed based on app visibility and user permissions.
   * Used by Nginx auth_request to protect file downloads.
   * @param originalUri The original file path (e.g., /files/my-app/1.0.0/file.bin)
   * @param authHeader The Authorization header value (may be undefined)
   * @returns true if access is allowed
   * @throws UnauthorizedError if access is denied
   */
  async checkFileAccess(originalUri: string, authHeader: string | undefined): Promise<boolean> {
    // Extract appKey from path: /files/{appKey}/{versionName}/{fileName}
    const pathMatch = originalUri.match(/^\/files\/([^/]+)\//);
    if (!pathMatch) {
      throw new UnauthorizedError('Invalid file path');
    }

    const appKey = pathMatch[1];
    const app = await this.appsRepo.findByKey(appKey);

    if (!app) {
      throw new UnauthorizedError('App not found');
    }

    // Public apps allow unauthenticated access
    if (app.is_public === 1) {
      return true;
    }

    // Private app - require valid token
    if (!authHeader) {
      throw new UnauthorizedError('Authentication required for private app files');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Invalid authorization header');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // Admin or global scope has access to all apps
      if (decoded.permission === 'admin' || decoded.appScope === null) {
        return true;
      }

      // Check if user has access to this specific app
      if (decoded.appScope.includes(appKey)) {
        return true;
      }

      throw new UnauthorizedError('No access to this app');
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
