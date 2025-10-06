import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'node:http';
import { JWT_SECRET } from './config.js';

// JWT verification middleware
export function verifyToken(req: IncomingMessage): { userId: number; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}