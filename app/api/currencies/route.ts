import { NextResponse } from "next/server"
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