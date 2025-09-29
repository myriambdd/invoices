import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const suppliers = await query(`
      SELECT * FROM suppliers WHERE id = $1
    `, [params.id])

    if (!suppliers.length) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(suppliers[0])
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, email, phone, address, tax_id, iban, bic, rib } = body

    const suppliers = await query(`
      UPDATE suppliers 
      SET name = $1, email = $2, phone = $3, 
          address = $4, tax_id = $5, iban = $6, 
          bic = $7, rib = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [name, email, phone, address, tax_id, iban, bic, rib, params.id])

    if (!suppliers.length) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(suppliers[0])
  } catch (error) {
    console.error("Error updating supplier:", error)
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const suppliers = await query(`
      DELETE FROM suppliers WHERE id = $1
      RETURNING *
    `, [params.id])

    if (!suppliers.length) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}