import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groupMemberships } from '@/lib/schema';
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

  try {
    // Check if user has a pending invitation
    const membershipResult = await db.select()
      .from(groupMemberships)
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, user.userId),
        eq(groupMemberships.status, 'invited')
      ))
      .limit(1);

    if (membershipResult.length === 0) {
      return NextResponse.json({ error: 'No pending invitation found' }, { status: 404 });
    }

    // Accept the invitation
    await db.update(groupMemberships)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(and(
        eq(groupMemberships.groupId, groupId),
        eq(groupMemberships.userId, user.userId)
      ));

    return NextResponse.json({ message: 'Successfully joined the group' });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}