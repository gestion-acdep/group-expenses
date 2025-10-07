import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, groupMemberships, users, expenses } from '@/lib/schema';
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
    // Check if user owns the group or is a member
    const groupResult = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groupResult[0];
    const isOwner = group.userId === user.userId;

    // Check if user is invited/accepted member
    const membershipResult = await db.select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, user.userId)))
      .limit(1);

    const isMember = membershipResult.length > 0 && membershipResult[0].status === 'accepted';

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all memberships for the group
    const memberships = await db.select({
      id: groupMemberships.id,
      userId: groupMemberships.userId,
      status: groupMemberships.status,
      invitedAt: groupMemberships.invitedAt,
      acceptedAt: groupMemberships.acceptedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    })
    .from(groupMemberships)
    .leftJoin(users, eq(groupMemberships.userId, users.id))
    .where(eq(groupMemberships.groupId, groupId));

    return NextResponse.json({
      group: {
        ...group,
        members: JSON.parse(group.members),
        memberships,
        isOwner,
        isMember
      }
    });
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
    // Check permissions - only owner can update group details
    const groupResult = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groupResult[0];
    if (group.userId !== user.userId) {
      return NextResponse.json({ error: 'Only group owner can update group details' }, { status: 403 });
    }

    const { name, description, members, currency, isActive } = await request.json();

    const updateData: { name?: string; description?: string; members?: string; currency?: string; isActive?: boolean } = { name, description, currency, isActive };
    if (members) {
      updateData.members = JSON.stringify(members);
    }

    await db.update(groups)
      .set(updateData)
      .where(eq(groups.id, groupId));

    // Fetch the updated group
    const updatedGroup = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    return NextResponse.json({ group: { ...updatedGroup[0], members: JSON.parse(updatedGroup[0].members) } });
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
    // Check permissions - only owner can delete group
    const groupResult = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groupResult[0];
    if (group.userId !== user.userId) {
      return NextResponse.json({ error: 'Only group owner can delete the group' }, { status: 403 });
    }

    // Delete related records first to avoid foreign key constraint errors
    await db.delete(expenses).where(eq(expenses.groupId, groupId));
    await db.delete(groupMemberships).where(eq(groupMemberships.groupId, groupId));

    const result = await db.delete(groups)
      .where(eq(groups.id, groupId))
      .returning();

    return NextResponse.json({ message: 'Group deleted' });
  } catch (error) {
    logger.error('Delete group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}