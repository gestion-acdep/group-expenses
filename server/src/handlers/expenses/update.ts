import type { IncomingMessage, ServerResponse } from 'node:http';
import { db } from '../../db.js';
import { groups } from '../../entities/group.js';
import { expenses } from '../../entities/expense.js';
import { logger } from '../../logger.js';
import { verifyToken } from '../../auth.js';
import { eq, and } from 'drizzle-orm';

export async function handleUpdateExpense(req: IncomingMessage, res: ServerResponse, expenseId: number) {
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
      const { description, amount, paidBy, splitBetween, category, currency } = JSON.parse(body);

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

      const result = await db.update(expenses)
        .set({
          description,
          amount: parseFloat(amount),
          paidBy,
          splitBetween: JSON.stringify(splitBetween),
          category,
          currency
        })
        .where(eq(expenses.id, expenseId))
        .returning();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ expense: { ...result[0], splitBetween: JSON.parse(result[0].splitBetween) } }));
    } catch (error) {
      logger.error('Update expense error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}