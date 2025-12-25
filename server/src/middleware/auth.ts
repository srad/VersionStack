import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Errors } from '../utils/responses';
import { JwtPayload, Permission } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Permission hierarchy: admin > write > read
const permissionHierarchy: Record<Permission, number> = {
  read: 1,
  write: 2,
  admin: 3,
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return Errors.unauthorized(res, 'Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return Errors.invalidToken(res, 'Token has expired');
    }
    return Errors.invalidToken(res, 'Invalid token');
  }
};

// Optional authentication: sets req.user if valid token present, but doesn't fail if missing
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without user
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch {
    // Invalid token, continue without user (don't fail)
  }

  next();
};

// Middleware factory: require minimum permission level
export function requirePermission(minPermission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return Errors.unauthorized(res);
    }

    const userLevel = permissionHierarchy[req.user.permission];
    const requiredLevel = permissionHierarchy[minPermission];

    if (userLevel < requiredLevel) {
      return Errors.forbidden(res, `Requires ${minPermission} permission`);
    }

    next();
  };
}

// Middleware factory: check app scope access
export function requireAppAccess(getAppKey: (req: Request) => string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return Errors.unauthorized(res);
    }

    // Global access (appScope is null) or admin always has access
    if (req.user.appScope === null || req.user.permission === 'admin') {
      return next();
    }

    const appKey = getAppKey(req);
    if (!req.user.appScope.includes(appKey)) {
      return Errors.forbidden(res, `No access to app: ${appKey}`);
    }

    next();
  };
}
