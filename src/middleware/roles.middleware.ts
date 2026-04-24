import { Request, Response, NextFunction } from 'express';
import { sendError } from '../helpers/response';

export const requireRoles = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', 403, 'Insufficient permissions');
    }
    next();
  };
