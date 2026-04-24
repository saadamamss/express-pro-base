import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../helpers/response';

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      return sendError(res, messages.join(', '), 400, 'Validation Error');
    }
    req.body = result.data;
    next();
  };
