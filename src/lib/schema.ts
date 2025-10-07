import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  members: text('members').notNull(), // JSON string array
  userId: integer('user_id').notNull().references(() => users.id),
  currency: text('currency').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  paidBy: text('paid_by').notNull(),
  splitBetween: text('split_between').notNull(), // JSON string array
  date: integer('date', { mode: 'timestamp' }).notNull(),
  category: text('category').notNull(),
  groupId: integer('group_id').notNull().references(() => groups.id),
  currency: text('currency').notNull(),
});