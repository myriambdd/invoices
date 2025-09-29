import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const currencies = await query(`
      SELECT * FROM currencies ORDER BY is_base DESC, code ASC
    `)
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

    const currencies = await query(`
      INSERT INTO currencies (code, name, symbol, is_base)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `, [code.toUpperCase(), name, symbol || code.toUpperCase()])

    return NextResponse.json(currencies[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating currency:", error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "Currency code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create currency" }, { status: 500 })
  }
}