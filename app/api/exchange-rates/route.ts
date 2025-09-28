import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const rates = await sql`
      SELECT er.*, 
             fc.code as from_currency_code, fc.name as from_currency_name,
             tc.code as to_currency_code, tc.name as to_currency_name
      FROM exchange_rates er
      JOIN currencies fc ON er.from_currency_id = fc.id
      JOIN currencies tc ON er.to_currency_id = tc.id
      ORDER BY fc.code, tc.code
    `
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from_currency_id, to_currency_id, rate } = body

    if (!from_currency_id || !to_currency_id || !rate) {
      return NextResponse.json({ error: "from_currency_id, to_currency_id, and rate are required" }, { status: 400 })
    }

    const [exchangeRate] = await sql`
      INSERT INTO exchange_rates (from_currency_id, to_currency_id, rate)
      VALUES (${from_currency_id}, ${to_currency_id}, ${rate})
      ON CONFLICT (from_currency_id, to_currency_id)
      DO UPDATE SET rate = ${rate}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json(exchangeRate, { status: 201 })
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    return NextResponse.json({ error: "Failed to update exchange rate" }, { status: 500 })
  }
}
