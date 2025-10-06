import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { expenses } from '../../entities/expense.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq, and } from 'drizzle-orm';

export async function handleCreateExpense(req: IncomingMessage, res: ServerResponse, groupId: number) {
  const user = verifyToken(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // Verify group ownership
  const groupCheck = await db.select().from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.userId))).limit(1);
  if (groupCheck.length === 0) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Group not found' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { description, amount, paidBy, splitBetween, category, currency } = JSON.parse(body);

      if (!description || !amount || !paidBy || !splitBetween || !category || !currency) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'All fields are required' }));
        return;
      }

      const result = await db.insert(expenses).values({
        description,
        amount: parseFloat(amount),
        paidBy,
        splitBetween: JSON.stringify(splitBetween),
        category,
        groupId,
        currency,
        date: new Date(),
      }).returning();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ expense: { ...result[0], splitBetween: JSON.parse(result[0].splitBetween) } }));
    } catch (error) {
      logger.error('Create expense error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}