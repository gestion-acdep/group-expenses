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
    const { name, description, members, currency } = await request.json();

    if (!name || !currency || !members) {
      return NextResponse.json({ error: 'Name, currency, and members are required' }, { status: 400 });
    }

    const result = await db.insert(groups).values({
      name,
      description,
      members: JSON.stringify(members),
      userId: user.userId,
      currency,
    }).returning();

    return NextResponse.json({ group: { ...result[0], members: JSON.parse(result[0].members) } }, { status: 201 });
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

    const groupsWithParsed = userGroups.map(group => ({
      ...group,
      members: JSON.parse(group.members)
    }));

    return NextResponse.json({ groups: groupsWithParsed });
  } catch (error) {
    logger.error('Get groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}