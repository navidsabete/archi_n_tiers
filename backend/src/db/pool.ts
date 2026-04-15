import { Pool } from 'pg';

let pool: Pool | null = null;

export const getDatabaseUrl = (): string => {
  return (
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@postgres:5432/ligue_sportive'
  );
};

export const getPool = (): Pool => {
  if (pool) return pool;

  pool = new Pool({
    connectionString: getDatabaseUrl(),
    max: Number(process.env.PGPOOL_MAX || 10),
  });

  return pool;
};

export const resetPool = async (): Promise<void> => {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
};

