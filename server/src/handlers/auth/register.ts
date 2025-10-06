import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { users } from '../../entities/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../logger.js';
import { JWT_SECRET } from '../../config.js';
import { eq } from 'drizzle-orm';

export async function handleRegister(req: IncomingMessage, res: ServerResponse) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { email, password, name } = JSON.parse(body);
      logger.info(`Request parameters: email=${email}, name=${name}`);

      if (!email || !password || !name) {
        logger.info(`Response: 400 ${JSON.stringify({ error: 'Email, password, and name are required' })}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email, password, and name are required' }));
        return;
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        logger.info(`Response: 409 ${JSON.stringify({ error: 'User already exists' })}`);
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User already exists' }));
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
      }).returning({ id: users.id, email: users.email, name: users.name });

      const user = result[0];

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`Response: 201 ${JSON.stringify({
        user: { id: user.id, email: user.email, name: user.name },
        token: '[REDACTED]'
      })}`);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user: { id: user.id, email: user.email, name: user.name },
        token
      }));
    } catch (error) {
      logger.error('Registration error:', error);
      logger.info(`Response: 500 ${JSON.stringify({ error: 'Internal server error' })}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}