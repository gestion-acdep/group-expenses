import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { expenses } from '../../entities/expense.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq, and } from 'drizzle-orm';

export async function handleGetExpenses(req: IncomingMessage, res: ServerResponse, groupId: number) {
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

  try {
    const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId));

    const expensesWithParsed = groupExpenses.map(exp => ({
      ...exp,
      splitBetween: JSON.parse(exp.splitBetween)
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ expenses: expensesWithParsed }));
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}