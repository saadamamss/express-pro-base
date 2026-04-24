import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const { method, originalUrl } = req;
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`[${requestId}] ${method} ${originalUrl} ${res.statusCode} — ${ms}ms`, {
      requestId,
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration: ms,
    });
  });

  next();
};