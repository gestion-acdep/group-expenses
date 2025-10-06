import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './user.js';

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  userId: integer('user_id').notNull().references(() => users.id),
  currency: text('currency').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});