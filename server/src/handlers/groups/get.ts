import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq } from 'drizzle-orm';

export async function handleGetGroups(req: IncomingMessage, res: ServerResponse) {
  const user = verifyToken(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    const userGroups = await db.select().from(groups).where(eq(groups.userId, user.userId));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ groups: userGroups }));
  } catch (error) {
    logger.error('Get groups error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}