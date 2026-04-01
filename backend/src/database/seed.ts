import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema/users';

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

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? 'admin@greenquote.local'
  ).toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123456!';

  await upsertUser(db, {
    email: adminEmail,
    password: adminPassword,
    fullName: 'System Admin',
    role: 'admin',
  });

  const demoAdminEmail = (
    process.env.DEMO_ADMIN_EMAIL ?? 'admin@test.com'
  ).toLowerCase();
  const demoUserEmail = (
    process.env.DEMO_USER_EMAIL ?? 'user@test.com'
  ).toLowerCase();
  const demoPassword =
    process.env.DEMO_ADMIN_PASSWORD ??
    process.env.DEMO_USER_PASSWORD ??
    'password123';

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
