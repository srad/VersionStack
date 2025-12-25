import { Response } from 'express';

// Standard error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  VERSION_NOT_FOUND: 'VERSION_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

// Send error response
function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, string[]>
): void {
  const response: ErrorResponse = { code, message };
  if (details) {
    response.details = details;
  }
  res.status(statusCode).json(response);
}

// Convenience methods for common errors
export const Errors = {
  badRequest: (res: Response, message: string, details?: Record<string, string[]>) =>
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, message, details),

  invalidInput: (res: Response, message: string, details?: Record<string, string[]>) =>
    sendError(res, 400, ErrorCodes.INVALID_INPUT, message, details),

  unauthorized: (res: Response, message = 'Authentication required') =>
    sendError(res, 401, ErrorCodes.UNAUTHORIZED, message),

  invalidToken: (res: Response, message = 'Invalid or expired token') =>
    sendError(res, 401, ErrorCodes.INVALID_TOKEN, message),

  forbidden: (res: Response, message = 'Access denied') =>
    sendError(res, 403, ErrorCodes.FORBIDDEN, message),

  notFound: (res: Response, resource: string) =>
    sendError(res, 404, ErrorCodes.NOT_FOUND, `${resource} not found`),

  appNotFound: (res: Response) =>
    sendError(res, 404, ErrorCodes.APP_NOT_FOUND, 'App not found'),

  versionNotFound: (res: Response) =>
    sendError(res, 404, ErrorCodes.VERSION_NOT_FOUND, 'Version not found'),

  conflict: (res: Response, message: string) =>
    sendError(res, 409, ErrorCodes.CONFLICT, message),

  alreadyExists: (res: Response, resource: string) =>
    sendError(res, 409, ErrorCodes.ALREADY_EXISTS, `${resource} already exists`),

  internal: (res: Response, message = 'Internal server error') =>
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, message),

  database: (res: Response, message = 'Database error') =>
    sendError(res, 500, ErrorCodes.DATABASE_ERROR, message),
};
