import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from './db.js';
import { users } from './schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';
import { verifyToken } from './auth.js';
import { JWT_SECRET } from './config.js';
import { eq } from 'drizzle-orm';

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Registration endpoint
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
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
    return;
  }

  // Login endpoint
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
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
    return;
  }

  // Protected route example - get current user
  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = verifyToken(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    // Get full user data from database
    const userData = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, user.userId)).limit(1);

    if (userData.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user: userData[0] }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'server', time: new Date().toISOString() }));
}