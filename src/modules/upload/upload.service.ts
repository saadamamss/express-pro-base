import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env';

const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadService = {
  saveFile(file: Express.Multer.File) {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(16).toString('hex') + ext;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return {
      url: `${env.APP_URL}/uploads/${filename}`,
      filename,
      size: file.size,
    };
  },
};
