import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../helpers/response';
import { verifyRefreshToken } from '../../helpers/token';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body, res);
    sendSuccess(res, result);
  },

  async verifyEmail(req: Request, res: Response) {
    const result = await authService.verifyEmail(req.body);
    sendSuccess(res, result);
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, result);
  },

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, result);
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401).json({ success: false, message: 'No refresh token', error: 'Unauthorized' });
      return;
    }
    const payload = verifyRefreshToken(token);
    const result = await authService.refresh(payload.sub, res);
    sendSuccess(res, result);
  },

  async logout(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized', error: 'Unauthorized' });
      return;
    }
    const result = await authService.logout(user.id, res);
    sendSuccess(res, result);
  },

  async me(req: Request, res: Response) {
    sendSuccess(res, req.user);
  },
};
