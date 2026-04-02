import { Pool } from "pg";

let pool: Pool | null | undefined;

export function getPostgresPool(): Pool | null {
  if (pool !== undefined) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    pool = null;
    return pool;
  }

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

function shouldUseSsl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}
