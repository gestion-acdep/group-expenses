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

  const invitationId = parseInt(params.id);
  if (isNaN(invitationId)) {
    return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
  }

  try {
    const { action } = await request.json();
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check if invitation exists and belongs to user
    const invitation = await db.select()
      .from(groupMemberships)
      .where(and(
        eq(groupMemberships.id, invitationId),
        eq(groupMemberships.userId, user.userId),
        eq(groupMemberships.status, 'invited')
      ))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    await db.update(groupMemberships)
      .set({
        status: newStatus,
        acceptedAt: action === 'accept' ? new Date() : undefined,
      })
      .where(eq(groupMemberships.id, invitationId));

    return NextResponse.json({
      message: action === 'accept' ? 'Invitation accepted' : 'Invitation rejected'
    });
  } catch (error) {
    console.error('Handle invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}