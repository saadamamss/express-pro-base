import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis({
  host: env.REDIS_HOST || 'localhost',
  port: Number(env.REDIS_PORT) || 6379,
  username: env.REDIS_USERNAME || 'default',
  password: env.REDIS_PASSWORD || undefined,
  tls: env.REDIS_TLS === 'true' ? {} : undefined,
  retryStrategy: (times: number): number => Math.min(times * 200, 5000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err: Error) => console.error('❌ Redis error:', err.message));

export const redisClient = {
  async get<T>(key: string): Promise<T | null> {
    const val = await redis.get(key);
    if (val === null) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async keys(pattern: string): Promise<string[]> {
    return redis.keys(pattern);
  },

  async disconnect(): Promise<void> {
    await redis.disconnect();
  },
};

export default redis;