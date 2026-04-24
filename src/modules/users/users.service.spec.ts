import { usersService } from './users.service';
import { prisma } from '../../lib/prisma';
import { redisClient } from '../../lib/redis';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../lib/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  },
}));

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        data: [{ id: '1', name: 'Test' }] as any[],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (redisClient.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await usersService.getUsers(1, 10);

      expect(result).toEqual(cachedData);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if no cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Test User', email: 'test@test.com' },
      ]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (redisClient.set as jest.Mock).mockResolvedValue(undefined);

      await usersService.getUsers(1, 10);

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return cached user if available', async () => {
      const cachedUser = { id: '1', name: 'Test' };
      (redisClient.get as jest.Mock).mockResolvedValue(cachedUser);

      const result = await usersService.getUserById('1');

      expect(result).toEqual(cachedUser);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if no cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
      });

      await usersService.getUserById('1');

      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should hash password before saving', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Test',
        email: 'test@test.com',
      });
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      await usersService.createUser({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.password).not.toBe('password123');
    });
  });

  describe('updateUser', () => {
    it('should hash password if provided', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated',
        email: 'test@test.com',
      });
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      await usersService.updateUser('1', { password: 'newpassword123' });

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.password).not.toBe('newpassword123');
    });

    it('should invalidate cache after update', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Updated',
      });
      (redisClient.keys as jest.Mock).mockResolvedValue(['users:list:1:10']);
      (redisClient.del as jest.Mock).mockResolvedValue(undefined);

      await usersService.updateUser('1', { name: 'Updated' });

      expect(redisClient.del).toHaveBeenCalledWith('users:1');
      expect(redisClient.del).toHaveBeenCalledWith('users:list:1:10');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and invalidate cache', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue({});
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      await usersService.deleteUser('1');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(redisClient.del).toHaveBeenCalledWith('users:1');
    });
  });
});