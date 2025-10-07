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
    const { email, password, name } = await request.json();
    logger.info(`Request parameters: email=${email}, name=${name}`);

    if (!email || !password || !name) {
      logger.info(`Response: 400 ${JSON.stringify({ error: 'Email, password, and name are required' })}`);
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      logger.info(`Response: 409 ${JSON.stringify({ error: 'User already exists' })}`);
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
    }).returning({ id: users.id, email: users.email, name: users.name });

    const user = result[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`Response: 201 ${JSON.stringify({
      user: { id: user.id, email: user.email, name: user.name },
      token: '[REDACTED]'
    })}`);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    }, { status: 201 });
  } catch (error) {
    logger.error('Registration error:', error);
    logger.info(`Response: 500 ${JSON.stringify({ error: 'Internal server error' })}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}