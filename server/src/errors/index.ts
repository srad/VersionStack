import { ErrorCodes, type ErrorCode } from '../utils/responses';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number = 500,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ErrorCodes.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid or expired token') {
    super(ErrorCodes.INVALID_TOKEN, message, 401);
    this.name = 'InvalidTokenError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(ErrorCodes.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class AppNotFoundError extends AppError {
  constructor(appKey?: string) {
    super(
      ErrorCodes.APP_NOT_FOUND,
      appKey ? `App '${appKey}' not found` : 'App not found',
      404
    );
    this.name = 'AppNotFoundError';
  }
}

export class VersionNotFoundError extends AppError {
  constructor(versionId?: string | number) {
    super(
      ErrorCodes.VERSION_NOT_FOUND,
      versionId ? `Version '${versionId}' not found` : 'Version not found',
      404
    );
    this.name = 'VersionNotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCodes.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string) {
    super(ErrorCodes.ALREADY_EXISTS, `${resource} already exists`, 409);
    this.name = 'AlreadyExistsError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error') {
    super(ErrorCodes.DATABASE_ERROR, message, 500);
    this.name = 'DatabaseError';
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(ErrorCodes.INTERNAL_ERROR, message, 500);
    this.name = 'InternalError';
  }
}
