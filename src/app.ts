import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import uploadRoutes from './modules/upload/upload.routes';
import { prisma } from './lib/prisma';
import { sendSuccess, sendError } from './helpers/response';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './lib/swagger';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(loggingMiddleware);

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health
app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: 'ok', database: 'connected' });
  } catch {
    sendError(res, 'Database connection failed', 503);
  }
});

// Routes
app.use('/api/v1/auth',   authRoutes);
app.use('/api/v1/users',  usersRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Swagger (dev only)
if (env.NODE_ENV === 'development') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// 404
app.use((req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404, 'Not Found');
});

// Global error handler (must be last)
app.use(errorMiddleware);

export default app;
