import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { logger } from './logger.js';

export const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN!
});
export const db = drizzle(client);

// Initialize database tables
export async function initDb() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Database tables initialized');
  } catch (err) {
    logger.error('Database initialization failed', err);
  }
}