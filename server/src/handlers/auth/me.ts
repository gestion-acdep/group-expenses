import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { users } from '../../entities/user.js';
import { verifyToken } from '../../auth.js';
import { eq } from 'drizzle-orm';

export async function handleMe(req: IncomingMessage, res: ServerResponse) {
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
}