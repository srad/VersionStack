import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { Errors } from '../utils/responses';

// Input sanitization helpers
export const sanitize = {
  // Trim whitespace and normalize
  string: (value: string): string => {
    return value.trim();
  },

  // Remove potentially dangerous characters for display names
  displayName: (value: string): string => {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets (basic XSS prevention)
      .substring(0, 100); // Limit length
  },

  // Sanitize app key (should already be validated, but extra safety)
  appKey: (value: string): string => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
  },

  // Sanitize version name
  versionName: (value: string): string => {
    return value
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 50);
  },

  // Sanitize filename
  fileName: (value: string): string => {
    return value
      .trim()
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
      .replace(/\.\./g, '') // Prevent directory traversal
      .substring(0, 255);
  },
};

// Validation schemas
export const schemas = {
  // App schemas
  createApp: z.object({
    appKey: z
      .string()
      .min(1, 'App key is required')
      .max(50, 'App key must be 50 characters or less')
      .regex(
        /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        'App key must contain only alphanumeric characters, optionally separated by dashes'
      )
      .transform((val: string) => val.toLowerCase()),
    displayName: z
      .string()
      .max(100, 'Display name must be 100 characters or less')
      .optional()
      .transform((val: string | undefined) => (val ? sanitize.displayName(val) : val)),
    isPublic: z.boolean().optional().default(false),
  }),

  updateApp: z.object({
    displayName: z
      .string()
      .min(1, 'Display name cannot be empty')
      .max(100, 'Display name must be 100 characters or less')
      .optional()
      .transform((val: string | undefined) => (val ? sanitize.displayName(val) : val)),
    isPublic: z.boolean().optional(),
  }),

  // Auth schemas
  login: z.object({
    apiKey: z
      .string()
      .min(1, 'API key is required')
      .max(128, 'API key must be 128 characters or less'),
  }),

  createApiKey: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .transform((val: string) => sanitize.displayName(val)),
    permission: z.enum(['read', 'write', 'admin'], {
      message: 'Permission must be read, write, or admin',
    }),
    appScope: z
      .array(
        z
          .string()
          .min(1)
          .max(50)
          .regex(
            /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
            'Invalid app key format in scope'
          )
      )
      .optional(),
  }),

  apiKeyIdParam: z.object({
    keyId: z.string().regex(/^\d+$/, 'Key ID must be a number'),
  }),

  // Version schemas
  setActiveVersion: z.object({
    versionId: z
      .number()
      .int('Version ID must be an integer')
      .positive('Version ID must be positive'),
  }),

  uploadVersion: z.object({
    versionName: z
      .string()
      .max(50, 'Version name must be 50 characters or less')
      .regex(
        /^[a-zA-Z0-9._-]*$/,
        'Version name can only contain alphanumeric characters, dots, dashes, and underscores'
      )
      .optional()
      .transform((val: string | undefined) => (val ? sanitize.versionName(val) : val)),
  }),

  // URL parameter schemas
  appKeyParam: z.object({
    appKey: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/),
  }),

  versionIdParam: z.object({
    appKey: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/),
    versionId: z.string().regex(/^\d+$/, 'Version ID must be a number'),
  }),
};

// Format Zod errors into a details object
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }
  return details;
}

// Validation middleware factory
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return Errors.badRequest(res, 'Validation failed', formatZodErrors(result.error));
    }

    // Replace body with parsed/sanitized data
    req.body = result.data;
    next();
  };
}

// Validate URL parameters
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return Errors.invalidInput(res, 'Invalid URL parameters', formatZodErrors(result.error));
    }

    // Merge parsed data back into params (keeps Express typing happy)
    Object.assign(req.params, result.data);
    next();
  };
}

// Validate query parameters
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return Errors.invalidInput(res, 'Invalid query parameters', formatZodErrors(result.error));
    }

    // Merge parsed data back into query (keeps Express typing happy)
    Object.assign(req.query, result.data);
    next();
  };
}
