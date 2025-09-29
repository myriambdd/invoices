import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM exchange_rates WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting exchange rate:", error)
    return NextResponse.json({ error: "Failed to delete exchange rate" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { rate } = body

    const [updatedRate] = await sql`
      UPDATE exchange_rates 
      SET rate = ${Number.parseFloat(rate)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `

    return NextResponse.json(updatedRate)
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    return NextResponse.json({ error: "Failed to update exchange rate" }, { status: 500 })
  }
}