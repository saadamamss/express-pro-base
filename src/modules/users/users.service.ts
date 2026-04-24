import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { redisClient } from '../../lib/redis';
import { paginate, getSkipTake } from '../../helpers/pagination';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const usersService = {
  async getUsers(page: number, limit: number) {
    const cacheKey = `users:list:${page}:${limit}`;
    const cached = await redisClient.get<{ data: unknown[]; total: number; page: number; limit: number }>(cacheKey);
    if (cached) return cached;

    const { skip, take } = getSkipTake({ page, limit });
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take, select: userSelect }),
      prisma.user.count(),
    ]);
    const result = paginate(users, total, { page, limit });
    await redisClient.set(cacheKey, result, 5 * 60);
    return result;
  },

  async getUserById(id: string) {
    const cacheKey = `users:${id}`;
    const cached = await redisClient.get<{ id: string; name: string; email: string }>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (user) {
      await redisClient.set(cacheKey, user, 5 * 60);
    }
    return user;
  },

  async createUser(data: { name: string; email: string; password: string }) {
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: userSelect,
    });
    await this.invalidateUserCache();
    return user;
  },

  async updateUser(id: string, data: { name?: string; email?: string; password?: string }) {
    const updateData: Record<string, unknown> = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 12);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
    await this.invalidateUserCache();
    await redisClient.del(`users:${id}`);
    return updated;
  },

  async deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
    await this.invalidateUserCache();
    await redisClient.del(`users:${id}`);
    return { message: `User ${id} deleted successfully` };
  },

  async invalidateUserCache() {
    const keys = await redisClient.keys('users:list:*');
    if (keys.length) {
      await Promise.all(keys.map((k) => redisClient.del(k)));
    }
  },
};