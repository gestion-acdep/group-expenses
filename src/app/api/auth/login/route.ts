import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/config';
import { logger } from '@/lib/logger';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    logger.info(`Request parameters: email=${email}`);

    if (!email || !password) {
      logger.info(`Response: 400 ${JSON.stringify({ error: 'Email and password are required' })}`);
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userResult.length === 0) {
      logger.info(`Response: 401 ${JSON.stringify({ error: 'Invalid credentials' })}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.info(`Response: 401 ${JSON.stringify({ error: 'Invalid credentials' })}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    logger.info(`Response: 500 ${JSON.stringify({ error: 'Internal server error' })}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}