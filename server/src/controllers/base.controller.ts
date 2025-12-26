import { Response } from 'express';
import { AppError } from '../errors';
import { Errors } from '../utils/responses';

export abstract class BaseController {
  protected handleError(res: Response, err: unknown): void {
    if (err instanceof AppError) {
      res.status(err.status).json({
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      });
      return;
    }

    console.error('Unhandled error:', err);
    Errors.internal(res);
  }
}
