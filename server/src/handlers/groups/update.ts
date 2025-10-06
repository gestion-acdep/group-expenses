import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq, and } from 'drizzle-orm';

export async function handleUpdateGroup(req: IncomingMessage, res: ServerResponse, groupId: number) {
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
      const { name, description, currency, isActive } = JSON.parse(body);

      const result = await db.update(groups)
        .set({ name, description, currency, isActive })
        .where(and(eq(groups.id, groupId), eq(groups.userId, user.userId)))
        .returning();

      if (result.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Group not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ group: result[0] }));
    } catch (error) {
      logger.error('Update group error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}