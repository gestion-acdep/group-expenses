import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { users } from '../../entities/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../logger.js';
import { JWT_SECRET } from '../../config.js';
import { eq } from 'drizzle-orm';

export async function handleLogin(req: IncomingMessage, res: ServerResponse) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { email, password } = JSON.parse(body);
      logger.info(`Request parameters: email=${email}`);

      if (!email || !password) {
        logger.info(`Response: 400 ${JSON.stringify({ error: 'Email and password are required' })}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and password are required' }));
        return;
      }

      // Find user
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (userResult.length === 0) {
        logger.info(`Response: 401 ${JSON.stringify({ error: 'Invalid credentials' })}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }

      const user = userResult[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.info(`Response: 401 ${JSON.stringify({ error: 'Invalid credentials' })}`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user: { id: user.id, email: user.email, name: user.name },
        token
      }));
    } catch (error) {
      logger.error('Login error:', error);
      logger.info(`Response: 500 ${JSON.stringify({ error: 'Internal server error' })}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}