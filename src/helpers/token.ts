import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

export const generateJti = () => crypto.randomUUID();

interface TokenPayload {
  sub: string;
  email: string;
  tokenVersion: number;
  jti: string;
}

export const signAccessToken = (payload: { sub: string; email: string; tokenVersion: number }): string => {
  const jti = generateJti();
  return jwt.sign({ ...payload, jti }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const signRefreshToken = (payload: { sub: string; email: string; tokenVersion: number }): string => {
  const jti = generateJti();
  return jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};