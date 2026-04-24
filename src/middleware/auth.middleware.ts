import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../helpers/token';
import { prisma } from '../lib/prisma';
import { sendError } from '../helpers/response';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'Unauthorized', 401, 'Unauthorized');
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return sendError(res, 'Unauthorized', 401, 'Unauthorized');
    if (user.tokenVersion !== payload.tokenVersion) {
      return sendError(res, 'Token has been revoked', 401, 'Unauthorized');
    }
    const { password: _, ...rest } = user;
    req.user = rest;
    next();
  } catch {
    return sendError(res, 'Unauthorized', 401, 'Unauthorized');
  }
};
