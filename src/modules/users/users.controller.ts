import { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendError } from '../../helpers/response';

export const usersController = {
  async getUsers(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await usersService.getUsers(page, limit);
    sendSuccess(res, result);
  },

  async getUserById(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = await usersService.getUserById(id);
    if (!user) return sendError(res, `User with id ${id} not found`, 404, 'Not Found');
    sendSuccess(res, user);
  },

  async createUser(req: Request, res: Response) {
    const user = await usersService.createUser(req.body);
    sendSuccess(res, user, 201);
  },

  async updateUser(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = await usersService.updateUser(id, req.body);
    sendSuccess(res, user);
  },

  async deleteUser(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await usersService.deleteUser(id);
    sendSuccess(res, result);
  },
};
