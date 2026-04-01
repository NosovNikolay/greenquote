import {
  pgTable,
  uuid,
  integer,
  doublePrecision,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { QuoteResultPayload } from '../../common/types/quote-result.types';
import { users } from './users';

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  monthlyConsumptionKwh: integer('monthly_consumption_kwh').notNull(),
  systemSizeKw: doublePrecision('system_size_kw').notNull(),
  /** Stored in USD with 2 decimal precision (numeric in DB). */
  downPaymentUsd: doublePrecision('down_payment_usd').notNull(),
  result: jsonb('result').$type<QuoteResultPayload>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type QuoteRow = typeof quotes.$inferSelect;
export type QuoteInsert = typeof quotes.$inferInsert;
