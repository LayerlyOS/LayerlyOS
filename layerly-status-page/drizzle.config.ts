import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

let rawUrl = process.env.STATUS_PAGE_DATABASE_URL ?? '';

if (rawUrl) {
  rawUrl = rawUrl.replace(/^["']|["']$/g, '');
  if (!rawUrl.includes('sslmode=')) {
    rawUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}sslmode=no-verify`;
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: rawUrl,
  },
  verbose: true,
  strict: true,
});
