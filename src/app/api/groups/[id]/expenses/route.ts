import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, expenses } from '@/lib/schema';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupId = parseInt(params.id);
  if (isNaN(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  // Verify group ownership
  const groupCheck = await db.select().from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.userId))).limit(1);
  if (groupCheck.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  try {
    const { description, amount, paidBy, splitBetween, category, currency } = await request.json();

    if (!description || !amount || !paidBy || !splitBetween || !category || !currency) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
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

    return NextResponse.json({ expense: { ...result[0], splitBetween: JSON.parse(result[0].splitBetween) } }, { status: 201 });
  } catch (error) {
    logger.error('Create expense error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupId = parseInt(params.id);
  if (isNaN(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  // Verify group ownership
  const groupCheck = await db.select().from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.userId))).limit(1);
  if (groupCheck.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  try {
    const groupExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId));

    const expensesWithParsed = groupExpenses.map(exp => ({
      ...exp,
      splitBetween: JSON.parse(exp.splitBetween)
    }));

    return NextResponse.json({ expenses: expensesWithParsed });
  } catch (error) {
    logger.error('Get expenses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}