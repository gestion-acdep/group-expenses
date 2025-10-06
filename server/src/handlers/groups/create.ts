import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';

export async function handleCreateGroup(req: IncomingMessage, res: ServerResponse) {
  const user = verifyToken(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { name, description, currency } = JSON.parse(body);

      if (!name || !currency) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Name and currency are required' }));
        return;
      }

      const result = await db.insert(groups).values({
        name,
        description,
        userId: user.userId,
        currency,
      }).returning();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ group: result[0] }));
    } catch (error) {
      logger.error('Create group error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}