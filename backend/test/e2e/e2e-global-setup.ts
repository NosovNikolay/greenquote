import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Runs once before e2e workers. Ensures schema is applied (requires Postgres).
 */
export default function globalSetup(): void {
  const root = resolve(__dirname, '../..');
  config({ path: resolve(root, '.env.local') });
  config({ path: resolve(root, '.env') });
  config({ path: resolve(root, '.env.test') });

  if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL =
      'postgresql://greenquote:greenquote@127.0.0.1:5433/greenquote';
  }
  if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'e2e-jwt-secret-at-least-32-characters-long!!';
  }

  execSync('npx drizzle-kit migrate --config drizzle.config.ts', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
}
