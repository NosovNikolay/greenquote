import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

// Load env the same way as Nest (`ConfigModule` reads `.env.local` then `.env`).
config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is missing. Set it in backend/.env (see .env.example) or export it before running drizzle-kit. Example: postgresql://greenquote:greenquote@127.0.0.1:5433/greenquote',
  );
}

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
