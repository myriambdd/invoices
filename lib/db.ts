// src/lib/db.ts
import { Pool } from "pg"

// Fail fast if missing
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// Reuse pool in dev to avoid too many clients on hot-reload
const globalForPg = global as unknown as { pgPool?: Pool }

export const pg =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // For Neon in prod you may need SSL:
    // ssl: { rejectUnauthorized: false },
  })

if (!globalForPg.pgPool) globalForPg.pgPool = pg

export type Row = Record<string, unknown>

export async function query<T = Row>(text: string, params?: any[]) {
  const res = await pg.query<T>(text, params)
  return res
}

// Optional: quick connectivity check (call once on server start)
export async function assertDbHealthy() {
  await pg.query("select 1")
}
