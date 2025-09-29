import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [supplier] = await sql`
      SELECT * FROM suppliers WHERE id = ${params.id}
    `

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, email, phone, address, tax_id, iban, bic, rib } = body

    const [supplier] = await sql`
      UPDATE suppliers 
      SET name = ${name}, email = ${email}, phone = ${phone}, 
          address = ${address}, tax_id = ${tax_id}, iban = ${iban}, 
          bic = ${bic}, rib = ${rib}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Error updating supplier:", error)
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [supplier] = await sql`
      DELETE FROM suppliers WHERE id = ${params.id}
      RETURNING *
    `

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}