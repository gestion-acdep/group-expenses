import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { expenses } from '../../entities/expense.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq, and } from 'drizzle-orm';

export async function handleDeleteExpense(req: IncomingMessage, res: ServerResponse, expenseId: number) {
  const user = verifyToken(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    // First get the expense to verify ownership via group
    const expenseCheck = await db.select({
      id: expenses.id,
      groupId: expenses.groupId
    }).from(expenses).where(eq(expenses.id, expenseId)).limit(1);

    if (expenseCheck.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Expense not found' }));
      return;
    }

    const groupCheck = await db.select().from(groups).where(and(eq(groups.id, expenseCheck[0].groupId), eq(groups.userId, user.userId))).limit(1);
    if (groupCheck.length === 0) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Expense deleted' }));
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}