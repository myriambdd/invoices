import { Pool, PoolClient } from "pg"

// Environment variable with fallback
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://invoicer:invoicer_pw@localhost:5434/invoicedb"

// Create a single pool instance
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export type Row = Record<string, unknown>

// Simple query function using template literals
export async function sql<T = Row>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  const text = strings.reduce((result, string, i) => {
    return result + string + (values[i] ? `$${i + 1}` : '')
  }, '')
  
  const res = await pool.query<T>(text, values)
  return res.rows
}

// Alternative query function for direct SQL
export async function query<T = Row>(text: string, params?: any[]): Promise<T[]> {
  const res = await pool.query<T>(text, params)
  return res.rows
}

// Optional: quick connectivity check
export async function assertDbHealthy() {
  await pool.query("SELECT 1")
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