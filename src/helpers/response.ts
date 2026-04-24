import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, status = 200) => {
  res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendError = (res: Response, message: string, status = 500, error = 'Error') => {
  res.status(status).json({
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  });
};
