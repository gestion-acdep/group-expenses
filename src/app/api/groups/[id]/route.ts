import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups } from '@/lib/schema';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupId = parseInt(params.id);
  if (isNaN(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  try {
    const groupResult = await db.select().from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.userId))).limit(1);

    if (groupResult.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group: groupResult[0] });
  } catch (error) {
    logger.error('Get group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupId = parseInt(params.id);
  if (isNaN(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  try {
    const { name, description, currency, isActive } = await request.json();

    const result = await db.update(groups)
      .set({ name, description, currency, isActive })
      .where(and(eq(groups.id, groupId), eq(groups.userId, user.userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group: result[0] });
  } catch (error) {
    logger.error('Update group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groupId = parseInt(params.id);
  if (isNaN(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  try {
    const result = await db.delete(groups)
      .where(and(eq(groups.id, groupId), eq(groups.userId, user.userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Group deleted' });
  } catch (error) {
    logger.error('Delete group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}