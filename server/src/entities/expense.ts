import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { groups } from './group.js';

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