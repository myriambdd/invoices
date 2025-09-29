import { Pool } from "pg"

// Fail fast if missing
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// Reuse pool in dev to avoid too many clients on hot-reload
const globalForPg = global as unknown as { pgPool?: Pool }

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (!globalForPg.pgPool) globalForPg.pgPool = pool

export type Row = Record<string, unknown>

// Simple query function
export async function sql<T = Row>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query<T>(text, params)
  return res.rows
}

// Optional: quick connectivity check (call once on server start)
export async function assertDbHealthy() {
  await pool.query("select 1")
}

// Database types
export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  iban?: string
  bic?: string
  rib?: string
  created_at: string
  updated_at: string
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol?: string
  is_base: boolean
  created_at: string
}

export interface ExchangeRate {
  id: string
  from_currency_id: string
  to_currency_id: string
  rate: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number?: string
  supplier_id: string
  issue_date?: string
  due_date?: string
  total_amount: number
  currency_id: string
  total_amount_tnd?: number
  exchange_rate?: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  payment_terms?: string
  notes?: string
  original_file_path?: string
  extracted_data?: any
  created_at: string
  updated_at: string
}