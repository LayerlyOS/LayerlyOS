import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Cache the database connection in development.
 * This avoids creating a new connection on every HMR update.
 */
const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

// Fix for: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
// We replace them with 'verify-full' to maintain current behavior and silence the warning.
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  // Remove quotes if present
  connectionString = connectionString.replace(/^["']|["']$/g, '');
  
  // Remove all sslmode params from connection string - we use SSL config in Pool
  // Supabase uses self-signed certs, so we use rejectUnauthorized: false
  connectionString = connectionString
    .replace(/[?&]sslmode=[^&]*/g, '') // Remove sslmode=xxx
    .replace(/sslmode=[^&]*&?/g, '') // Remove leading sslmode=xxx
    .replace(/\?$/, ''); // Remove trailing ? if any
  
  // Debug: log connection string (no password)
  if (process.env.NODE_ENV === 'development') {
    const debugUrl = connectionString.replace(/:[^:@]+@/, ':****@');
    console.log('[DB] Connection string:', debugUrl);
  }
}

// For Supabase pooler we use smaller pool size
const poolSize = connectionString?.includes('pooler') ? 10 : 20;

const conn =
  globalForDb.conn ??
  new Pool({
    connectionString,
    max: poolSize,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10s for Supabase
    ssl: connectionString?.includes('supabase') ? {
      rejectUnauthorized: false, // Supabase uses self-signed certificates
    } : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
