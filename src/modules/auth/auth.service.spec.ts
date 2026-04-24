import { authService } from './auth.service';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      $transaction: jest.fn(),
    },
  },
}));

jest.mock('../../helpers/token', () => ({
  signAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
}));

jest.mock('../mail/mail.service', () => ({
  mailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('AuthService', () => {
  const mockResponse = () => {
    return {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw error if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });

      await expect(
        authService.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already in use');
    });

    it('should create user with hashed password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: '1',
              name: 'Test User',
              email: 'test@test.com',
              password: 'hashed_password',
              role: 'USER',
              tokenVersion: 0,
              failedLoginAttempts: 0,
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await authService.register({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Check your email to verify your account');
    });
  });

  describe('login', () => {
    it('should throw error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'nonexistent@test.com', password: 'password123' },
          mockResponse()
        )
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for locked account', async () => {
      const lockedDate = new Date(Date.now() + 30 * 60 * 1000);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        lockedUntil: lockedDate,
        failedLoginAttempts: 0,
        emailVerified: true,
        tokenVersion: 0,
      });

      await expect(
        authService.login(
          { email: 'test@test.com', password: 'password123' },
          mockResponse()
        )
      ).rejects.toThrow('Account locked');
    });

    it('should increment failedLoginAttempts on wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('correctpassword', 12),
        lockedUntil: null,
        failedLoginAttempts: 2,
        emailVerified: true,
        tokenVersion: 0,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await expect(
        authService.login(
          { email: 'test@test.com', password: 'wrongpassword' },
          mockResponse()
        )
      ).rejects.toThrow('Invalid credentials');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { failedLoginAttempts: 3 },
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('correctpassword', 12),
        lockedUntil: null,
        failedLoginAttempts: 4,
        emailVerified: true,
        tokenVersion: 0,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await expect(
        authService.login(
          { email: 'test@test.com', password: 'wrongpassword' },
          mockResponse()
        )
      ).rejects.toThrow('Invalid credentials');

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.lockedUntil).toBeDefined();
      expect(updateCall.data.failedLoginAttempts).toBe(0);
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
        lockedUntil: null,
        failedLoginAttempts: 3,
        emailVerified: true,
        tokenVersion: 0,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authService.login(
        { email: 'test@test.com', password },
        mockResponse()
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw error for unverified email', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
        lockedUntil: null,
        failedLoginAttempts: 0,
        emailVerified: false,
        tokenVersion: 0,
      });

      await expect(
        authService.login(
          { email: 'test@test.com', password },
          mockResponse()
        )
      ).rejects.toThrow('Please verify your email first');
    });
  });

  describe('logout', () => {
    it('should increment tokenVersion', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      const res = mockResponse();

      const result = await authService.logout('user-id-123', res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

  describe('forgotPassword', () => {
    it('should return generic message for non-existent email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.forgotPassword({ email: 'nonexistent@test.com' });

      expect(result.message).toBe('If this email exists, a reset link was sent');
    });

    it('should generate reset token for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authService.forgotPassword({ email: 'test@test.com' });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.message).toBe('If this email exists, a reset link was sent');
    });
  });

  describe('resetPassword', () => {
    it('should throw error for invalid token', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.resetPassword({ token: 'invalid-token', newPassword: 'newpassword123' })
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should reset password and increment tokenVersion', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authService.resetPassword({
        token: 'valid-token',
        newPassword: 'newpassword123',
      });

      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.tokenVersion).toEqual({ increment: 1 });
      expect(updateCall.data.resetToken).toBeNull();
      expect(result.message).toBe('Password reset successfully');
    });
  });
});