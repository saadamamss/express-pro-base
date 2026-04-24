import { Request, Response } from 'express';
import { uploadService } from './upload.service';
import { sendSuccess } from '../../helpers/response';

export const uploadController = {
  uploadImage(req: Request, res: Response) {
    const file = req.file!;
    const result = uploadService.saveFile(file);
    sendSuccess(res, result, 201);
  },

  uploadFile(req: Request, res: Response) {
    const file = req.file!;
    const result = uploadService.saveFile(file);
    sendSuccess(res, result, 201);
  },
};
