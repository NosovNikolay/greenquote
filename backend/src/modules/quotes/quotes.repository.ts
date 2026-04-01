import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/drizzle.provider';
import {
  quotes,
  users,
  type QuoteInsert,
  type QuoteRow,
} from '../../database/schema';

@Injectable()
export class QuotesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: QuoteInsert): Promise<QuoteRow> {
    const inserted = await this.db.insert(quotes).values(data).returning();
    const row = inserted[0];
    if (!row) {
      throw new Error('Quote insert returned no row');
    }
    return row;
  }

  async findById(id: string): Promise<QuoteRow | null> {
    const rows = await this.db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByIdWithUser(id: string): Promise<{
    quote: QuoteRow;
    userEmail: string;
    userFullName: string;
  } | null> {
    const rows = await this.db
      .select({
        quote: quotes,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(quotes)
      .innerJoin(users, eq(quotes.userId, users.id))
      .where(eq(quotes.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      quote: row.quote,
      userEmail: row.userEmail,
      userFullName: row.userFullName,
    };
  }

  async findByUserId(userId: string): Promise<QuoteRow[]> {
    return this.db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  async findByUserIdWithUser(userId: string): Promise<
    Array<{
      quote: QuoteRow;
      userEmail: string;
      userName: string;
    }>
  > {
    return this.db
      .select({
        quote: quotes,
        userEmail: users.email,
        userName: users.fullName,
      })
      .from(quotes)
      .innerJoin(users, eq(quotes.userId, users.id))
      .where(eq(quotes.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  async findAllForAdmin(search?: string): Promise<
    Array<{
      quote: QuoteRow;
      userEmail: string;
      userName: string;
    }>
  > {
    const trimmed = search?.trim();

    return this.db
      .select({
        quote: quotes,
        userEmail: users.email,
        userName: users.fullName,
      })
      .from(quotes)
      .innerJoin(users, eq(quotes.userId, users.id))
      .where(
        trimmed
          ? or(
              ilike(users.email, `%${trimmed}%`),
              ilike(users.fullName, `%${trimmed}%`),
            )
          : sql`true`,
      )
      .orderBy(desc(quotes.createdAt));
  }
}
