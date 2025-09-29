import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const currencies = await sql`
      SELECT * FROM currencies ORDER BY is_base DESC, code ASC
    `
    return NextResponse.json(currencies)
  } catch (error) {
    console.error("Error fetching currencies:", error)
    return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, symbol } = body

    if (!code || !name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 })
    }

    const [currency] = await sql`
      INSERT INTO currencies (code, name, symbol, is_base)
      VALUES (${code.toUpperCase()}, ${name}, ${symbol || code}, false)
      RETURNING *
    `

    return NextResponse.json(currency, { status: 201 })
  } catch (error) {
    console.error("Error creating currency:", error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "Currency code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create currency" }, { status: 500 })
  }
}