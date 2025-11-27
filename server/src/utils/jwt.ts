import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface JwtPayload { userId: string; }

export function signToken(userId: string) {
  return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
