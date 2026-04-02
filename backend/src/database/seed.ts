import 'dotenv/config';
import { PRICE_PER_KW_EUR } from '@greenquote/constants';
import * as bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { serializeQuoteResultPayload } from '../common/types/quote-result-storage';
import { PricingService } from '../modules/quotes/pricing.service';
import { quotes } from './schema/quotes';
import { users } from './schema/users';

const pricing = new PricingService();

async function seedDemoQuotesForDefaultUser(
  db: ReturnType<typeof drizzle>,
  userId: string,
  fullName: string,
  email: string,
): Promise<void> {
  const countRows = await db
    .select({ n: sql<number>`cast(count(*) as int)` })
    .from(quotes)
    .where(eq(quotes.userId, userId));
  const existing = Number(countRows[0]?.n ?? 0);
  const target = 30;
  if (existing >= target) {
    console.log(
      `Seed skip: demo user already has ${existing} quotes (target ${target})`,
    );
    return;
  }
  const toAdd = target - existing;
  const now = Date.now();
  for (let i = 0; i < toAdd; i++) {
    const systemSizeKw = 4 + (i % 12) * 0.5;
    const monthlyConsumptionKwh = 280 + (i % 15) * 25;
    const rawDown = 500 + i * 40;
    const systemPriceEur = systemSizeKw * PRICE_PER_KW_EUR;
    const downPaymentEur = Math.min(rawDown, Math.max(0, systemPriceEur - 200));

    const payload = pricing.buildQuoteResult({
      monthlyConsumptionKwh,
      systemSizeKw,
      downPaymentEur,
      installationAddress: `${i + 1} Demo Str., Berlin, DE`,
    });
    const stored = serializeQuoteResultPayload({
      ...payload,
      inputs: {
        ...payload.inputs,
        fullName,
        email,
      },
    });

    await db.insert(quotes).values({
      userId,
      monthlyConsumptionKwh,
      systemSizeKw,
      downPaymentEurCents: stored.inputs.downPaymentEurCents,
      result: stored,
      createdAt: new Date(now - i * 3_600_000),
    });
  }
  console.log(`Seeded ${toAdd} quote(s) for default demo user ${email}`);
}

async function upsertUser(
  db: ReturnType<typeof drizzle>,
  opts: {
    email: string;
    password: string;
    fullName: string;
    role: 'user' | 'admin';
  },
): Promise<void> {
  const email = opts.email.toLowerCase();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    console.log(`Seed skip: ${email} already exists`);
    return;
  }
  const passwordHash = await bcrypt.hash(opts.password, 10);
  await db.insert(users).values({
    email,
    passwordHash,
    fullName: opts.fullName,
    role: opts.role,
  });
  console.log(`Seeded ${opts.role} user ${email}`);
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  const adminEmail = 'admin@greenquote.local';
  const adminPassword = 'Admin123456!';

  await upsertUser(db, {
    email: adminEmail,
    password: adminPassword,
    fullName: 'System Admin',
    role: 'admin',
  });

  const demoAdminEmail = 'admin@test.com';
  const demoUserEmail = 'user@test.com';
  const demoPassword = 'password123';

  await upsertUser(db, {
    email: demoAdminEmail,
    password: demoPassword,
    fullName: 'Admin User',
    role: 'admin',
  });

  await upsertUser(db, {
    email: demoUserEmail,
    password: demoPassword,
    fullName: 'Demo User',
    role: 'user',
  });

  const demoUserRows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, demoUserEmail.toLowerCase()))
    .limit(1);
  const demoUser = demoUserRows[0];
  if (demoUser) {
    await seedDemoQuotesForDefaultUser(
      db,
      demoUser.id,
      demoUser.fullName,
      demoUser.email,
    );
  }

  await pool.end();
}

function isErrno(err: unknown, code: string): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return (err as { code: string }).code === code;
  }
  return false;
}

function formatUnknownForLog(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  return '[unserializable]';
}

main().catch((err: unknown) => {
  console.error(err);
  const cause =
    err instanceof Error && 'cause' in err
      ? (err as Error & { cause?: unknown }).cause
      : err;
  if (isErrno(cause, 'ECONNREFUSED')) {
    console.error(
      '\nHint: Nothing is accepting TCP on that host/port (Postgres not running). From the backend folder run: npm run db:up  then retry migrate/seed. Ensure Docker Desktop is running.',
    );
  } else {
    const nested =
      err instanceof Error
        ? (err as Error & { cause?: unknown }).cause
        : undefined;
    const causeSuffix =
      nested === undefined || nested === null
        ? ''
        : formatUnknownForLog(nested);
    const text =
      err instanceof Error ? `${err.message}${causeSuffix}` : String(err);
    if (text.includes('role') && text.includes('does not exist')) {
      console.error(
        '\nHint: DATABASE_URL points at a Postgres without the `greenquote` user. Use the Docker URL from .env.example (port 5433) or create that role on your server.',
      );
    }
  }
  process.exit(1);
});
