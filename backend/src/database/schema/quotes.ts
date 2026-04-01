import {
  pgTable,
  uuid,
  integer,
  doublePrecision,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { QuoteResultStored } from '../../common/types/quote-result-storage';
import { users } from './users';

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  monthlyConsumptionKwh: integer('monthly_consumption_kwh').notNull(),
  systemSizeKw: doublePrecision('system_size_kw').notNull(),
  /** Same value as `result.inputs.downPaymentEurCents` (integer EUR cents). */
  downPaymentEurCents: integer('down_payment_eur_cents').notNull(),
  result: jsonb('result').$type<QuoteResultStored>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type QuoteRow = typeof quotes.$inferSelect;
export type QuoteInsert = typeof quotes.$inferInsert;
