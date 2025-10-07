import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, expenses } from '@/lib/schema';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expenseId = parseInt(params.id);
  if (isNaN(expenseId)) {
    return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
  }

  try {
    const { description, amount, paidBy, splitBetween, category, currency } = await request.json();

    // First get the expense to verify ownership via group
    const expenseCheck = await db.select({
      id: expenses.id,
      groupId: expenses.groupId
    }).from(expenses).where(eq(expenses.id, expenseId)).limit(1);

    if (expenseCheck.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const groupCheck = await db.select().from(groups).where(and(eq(groups.id, expenseCheck[0].groupId), eq(groups.userId, user.userId))).limit(1);
    if (groupCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    return NextResponse.json({ expense: { ...result[0], splitBetween: JSON.parse(result[0].splitBetween) } });
  } catch (error) {
    logger.error('Update expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expenseId = parseInt(params.id);
  if (isNaN(expenseId)) {
    return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });
  }

  try {
    // First get the expense to verify ownership via group
    const expenseCheck = await db.select({
      id: expenses.id,
      groupId: expenses.groupId
    }).from(expenses).where(eq(expenses.id, expenseId)).limit(1);

    if (expenseCheck.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const groupCheck = await db.select().from(groups).where(and(eq(groups.id, expenseCheck[0].groupId), eq(groups.userId, user.userId))).limit(1);
    if (groupCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return NextResponse.json({ message: 'Expense deleted' });
  } catch (error) {
    logger.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}