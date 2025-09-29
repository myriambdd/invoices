import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const rates = await query(`
      SELECT er.*, 
             fc.code as from_currency_code, fc.name as from_currency_name, fc.symbol as from_currency_symbol,
             tc.code as to_currency_code, tc.name as to_currency_name, tc.symbol as to_currency_symbol
      FROM exchange_rates er
      JOIN currencies fc ON er.from_currency_id = fc.id
      JOIN currencies tc ON er.to_currency_id = tc.id
      ORDER BY fc.code, tc.code
    `)
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from_currency, to_currency, rate } = body

    if (!from_currency || !to_currency || !rate) {
      return NextResponse.json({ error: "from_currency, to_currency, and rate are required" }, { status: 400 })
    }

    // Get currency IDs
    const [fromCurrency] = await query("SELECT id FROM currencies WHERE code = $1", [from_currency])
    const [toCurrency] = await query("SELECT id FROM currencies WHERE code = $1", [to_currency])

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json({ error: "Invalid currency codes" }, { status: 400 })
    }

    const [exchangeRate] = await query(`
      INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate)
      VALUES ($1, $2, $3)
      ON CONFLICT (from_currency_id, to_currency_id)
      DO UPDATE SET rate = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [fromCurrency.id, toCurrency.id, rate])

    return NextResponse.json(exchangeRate, { status: 201 })
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    return NextResponse.json({ error: "Failed to update exchange rate" }, { status: 500 })
  }
}