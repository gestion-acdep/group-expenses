import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groupMemberships, groups, users } from '@/lib/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userInvitations = await db.select({
      id: groupMemberships.id,
      groupId: groupMemberships.groupId,
      invitedBy: groupMemberships.invitedBy,
      invitedAt: groupMemberships.invitedAt,
      group: {
        id: groups.id,
        name: groups.name,
        description: groups.description,
        currency: groups.currency,
      },
      invitedByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(groupMemberships)
    .leftJoin(groups, eq(groupMemberships.groupId, groups.id))
    .leftJoin(users, eq(groupMemberships.invitedBy, users.id))
    .where(and(
      eq(groupMemberships.userId, user.userId),
      eq(groupMemberships.status, 'invited')
    ));

    return NextResponse.json({ invitations: userInvitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}