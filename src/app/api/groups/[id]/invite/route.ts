import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, users, groupMemberships } from '@/lib/schema';
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
    // Check if user owns the group
    const groupResult = await db.select().from(groups).where(and(eq(groups.id, groupId), eq(groups.userId, user.userId))).limit(1);
    if (groupResult.length === 0) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });
    }

    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check if user exists
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    const invitedUser = userResult[0];

    // Check if user is already invited or member
    const existingMembership = await db.select().from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, invitedUser.id)))
      .limit(1);

    if (existingMembership.length > 0) {
      const status = existingMembership[0].status;
      if (status === 'accepted') {
        return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 });
      } else if (status === 'invited') {
        return NextResponse.json({ error: 'User is already invited to this group' }, { status: 400 });
      }
    }

    // Create invitation
    await db.insert(groupMemberships).values({
      groupId,
      userId: invitedUser.id,
      status: 'invited',
      invitedBy: user.userId,
    });

    // TODO: Send email invitation (would need email service integration)

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}