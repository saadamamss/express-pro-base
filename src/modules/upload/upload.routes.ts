import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadController } from './upload.controller';

const imageUpload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

const fileUpload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload an image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/image', imageUpload.single('file'), uploadController.uploadImage);

/**
 * @swagger
 * /upload/file:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/file', fileUpload.single('file'), uploadController.uploadFile);

export default router;