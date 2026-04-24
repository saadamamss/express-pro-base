import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { signAccessToken, signRefreshToken } from '../../helpers/token';
import { mailService } from '../mail/mail.service';

const generateToken = (): string => crypto.randomBytes(32).toString('hex');

const tokenExpiry = (hours = 1): Date =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw Object.assign(new Error('Email already in use'), { status: 400 });

    const hashed = await bcrypt.hash(data.password, 12);
    const verifyToken = generateToken();

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          verifyToken,
          verifyTokenExpiry: tokenExpiry(24),
        },
      });
      await mailService.sendVerificationEmail(newUser.email, newUser.name, verifyToken);
      await mailService.sendWelcome(newUser.email, newUser.name);
      return newUser;
    });

    const { password: _, ...result } = user;
    return { ...result, message: 'Check your email to verify your account' };
  },

  async verifyEmail(data: { token: string }) {
    const user = await prisma.user.findFirst({
      where: {
        verifyToken: data.token,
        verifyTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    return { message: 'Email verified successfully' };
  },

  async login(data: { email: string; password: string }, res: Response) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 400 });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw Object.assign(
        new Error(`Account locked. Try again after ${user.lockedUntil.toISOString()}`),
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.failedLoginAttempts = 0;
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      throw Object.assign(new Error('Invalid credentials'), { status: 400 });
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    if (!user.emailVerified)
      throw Object.assign(new Error('Please verify your email first'), { status: 400 });

    const payload = { sub: user.id, email: user.email, tokenVersion: user.tokenVersion };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return { accessToken };
  },

  async refresh(userId: string, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 400 });

    const payload = { sub: user.id, email: user.email, tokenVersion: user.tokenVersion };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return { accessToken };
  },

  async logout(userId: string, res: Response) {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  },

  async forgotPassword(data: { email: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) return { message: 'If this email exists, a reset link was sent' };

    const resetToken = generateToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: tokenExpiry(1),
      },
    });

    await mailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If this email exists, a reset link was sent' };
  },

  async resetPassword(data: { token: string; newPassword: string }) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw Object.assign(new Error('Invalid or expired token'), { status: 400 });

    const hashed = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: { increment: 1 },
      },
    });

    return { message: 'Password reset successfully' };
  },
};