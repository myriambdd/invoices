import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const suppliers = await sql`
      SELECT * FROM suppliers 
      ORDER BY name ASC
    `
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address, tax_id, iban, bic, rib } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const [supplier] = await sql`
      INSERT INTO suppliers (name, email, phone, address, tax_id, iban, bic, rib)
      VALUES (${name}, ${email}, ${phone}, ${address}, ${tax_id}, ${iban}, ${bic}, ${rib})
      RETURNING *
    `

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error("Error creating supplier:", error)
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
