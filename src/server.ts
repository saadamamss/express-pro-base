/// <reference path="./types/express.d.ts" />
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { redisClient } from './lib/redis';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    await redisClient.get('test');
    console.log('✅ Redis connected');
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}/api/v1`);
    });
  } catch (err) {
    console.error('❌ Failed to start server', err);
    process.exit(1);
  }
};

start();