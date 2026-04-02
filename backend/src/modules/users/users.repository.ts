import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AppException } from '../../common/exceptions/app.exception';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { users, type UserInsert, type UserRow } from '../../database/schema';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    return this.runQuery('findByEmail', async () => {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      return rows[0] ?? null;
    });
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.runQuery('findById', async () => {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0] ?? null;
    });
  }

  async create(data: UserInsert): Promise<UserRow> {
    return this.runQuery('create', async () => {
      const inserted = await this.db.insert(users).values(data).returning();
      const row = inserted[0];
      if (!row) {
        throw AppException.internal('User insert returned no row', {
          operation: 'create',
        });
      }
      return row;
    });
  }

  private async runQuery<T>(
    operation: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Database error [users.${operation}]: ${err.message}`,
        err.stack,
      );
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.internal(
        'A database error occurred',
        { operation: `users.${operation}` },
        err,
      );
    }
  }
}
