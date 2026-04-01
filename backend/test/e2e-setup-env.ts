import { config } from 'dotenv';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
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
