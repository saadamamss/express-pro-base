import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number })?.status ?? (err as { statusCode?: number })?.statusCode ?? 500;
  const message = (err as { message?: string })?.message ?? 'Internal server error';

  logger.error(`${status} — ${message}`, {
    requestId: req.requestId,
    stack: (err as Error)?.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(status).json({
    success: false,
    message,
    error: (err as Error)?.name ?? 'Error',
    timestamp: new Date().toISOString(),
  });
};