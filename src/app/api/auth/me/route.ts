import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get full user data from database
  const userData = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, user.userId)).limit(1);

  if (userData.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: userData[0] });
}