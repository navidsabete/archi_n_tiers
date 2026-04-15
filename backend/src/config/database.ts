import { Pool } from 'pg';
import { getDatabaseUrl, getPool, resetPool } from '../db/pool';
import { ensureSchema } from '../db/schema';

type PgError = Error & { code?: string };

const getDbNameFromUrl = (databaseUrl: string): string | null => {
  try {
    const url = new URL(databaseUrl);
    const name = url.pathname.replace(/^\//, '').trim();
    return name.length ? name : null;
  } catch {
    return null;
  }
};

const buildMaintenanceUrl = (databaseUrl: string): string | null => {
  try {
    const url = new URL(databaseUrl);
    url.pathname = '/postgres';
    return url.toString();
  } catch {
    return null;
  }
};

const isSafeIdentifier = (value: string): boolean => /^[a-zA-Z0-9_]+$/.test(value);

const ensureDatabaseExists = async (databaseUrl: string): Promise<void> => {
  const dbName = getDbNameFromUrl(databaseUrl);
  if (!dbName) return;
  if (!isSafeIdentifier(dbName)) return;

  const maintenanceUrl = buildMaintenanceUrl(databaseUrl);
  if (!maintenanceUrl) return;

  const maintenancePool = new Pool({ connectionString: maintenanceUrl, max: 1 });
  try {
    const exists = await maintenancePool.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) as exists`,
      [dbName]
    );
    if (exists.rows[0]?.exists) return;

    await maintenancePool.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await maintenancePool.end();
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1 as ok');
    await ensureSchema();

    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    const err = error as PgError;

    if (err.code === '3D000' && process.env.NODE_ENV !== 'production') {
      try {
        const url = getDatabaseUrl();
        await ensureDatabaseExists(url);
        await resetPool();

        const pool = getPool();
        await pool.query('SELECT 1 as ok');
        await ensureSchema();

        console.log('✅ PostgreSQL connected successfully');
        return;
      } catch (inner) {
        console.error('❌ PostgreSQL connection error:', inner);
        process.exit(1);
      }
    }

    console.error('❌ PostgreSQL connection error:', error);
    process.exit(1);
  }
};
