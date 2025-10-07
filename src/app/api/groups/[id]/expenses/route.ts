import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, expenses, groupMemberships } from '@/lib/schema';
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

  // Check permissions - owner or accepted member can add expenses
  const groupCheck = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (groupCheck.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const membershipCheck = await db.select()
    .from(groupMemberships)
    .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, user.userId)))
    .limit(1);

  const isOwner = groupCheck[0].userId === user.userId;
  const isAcceptedMember = membershipCheck.length > 0 && membershipCheck[0].status === 'accepted';

  if (!isOwner && !isAcceptedMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

  // Check permissions - owner or accepted member can view expenses
  const groupCheck = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (groupCheck.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const membershipCheck = await db.select()
    .from(groupMemberships)
    .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, user.userId)))
    .limit(1);

  const isOwner = groupCheck[0].userId === user.userId;
  const isAcceptedMember = membershipCheck.length > 0 && membershipCheck[0].status === 'accepted';

  if (!isOwner && !isAcceptedMember) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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