import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups } from '@/lib/schema';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, currency } = await request.json();

    if (!name || !currency) {
      return NextResponse.json({ error: 'Name and currency are required' }, { status: 400 });
    }

    const result = await db.insert(groups).values({
      name,
      description,
      userId: user.userId,
      currency,
    }).returning();

    return NextResponse.json({ group: result[0] }, { status: 201 });
  } catch (error) {
    logger.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userGroups = await db.select().from(groups).where(eq(groups.userId, user.userId));

    return NextResponse.json({ groups: userGroups });
  } catch (error) {
    logger.error('Get groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}