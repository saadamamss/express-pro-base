import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';

const isProd = env.NODE_ENV === 'production';
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, ssl: isProd });
export const prisma = new PrismaClient({ adapter });