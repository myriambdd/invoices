import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const baseCurrencies = await query(`
      SELECT * FROM currencies WHERE is_base = true LIMIT 1
    `)

    if (!baseCurrencies.length) {
      // Fallback to TND if no base currency is set
      const tndCurrencies = await query(`
        SELECT * FROM currencies WHERE code = 'TND' LIMIT 1
      `)
      return NextResponse.json(tndCurrencies[0] || { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' })
    }

    return NextResponse.json(baseCurrencies[0])
  } catch (error) {
    console.error("Error fetching base currency:", error)
    return NextResponse.json({ error: "Failed to fetch base currency" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { currency_id } = await request.json()

    if (!currency_id) {
      return NextResponse.json({ error: "Currency ID is required" }, { status: 400 })
    }

    // Remove base flag from all currencies
    await query(`UPDATE currencies SET is_base = false`)
    
    // Set new base currency
    const updatedCurrencies = await query(`
      UPDATE currencies 
      SET is_base = true 
      WHERE id = $1
      RETURNING *
    `, [currency_id])

    if (!updatedCurrencies.length) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 })
    }

    return NextResponse.json(updatedCurrencies[0])
  } catch (error) {
    console.error("Error updating base currency:", error)
    return NextResponse.json({ error: "Failed to update base currency" }, { status: 500 })
  }
}