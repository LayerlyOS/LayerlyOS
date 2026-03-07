import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

let connectionString = process.env.STATUS_PAGE_DATABASE_URL ?? '';

if (connectionString) {
  connectionString = connectionString.replace(/^["']|["']$/g, '');
  connectionString = connectionString
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/sslmode=[^&]*&?/g, '')
    .replace(/\?$/, '');
}

const conn =
  globalForDb.conn ??
  new Pool({
    connectionString: connectionString || undefined,
    max: connectionString?.includes('pooler') ? 10 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: connectionString?.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
