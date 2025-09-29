import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query(`DELETE FROM exchange_rates WHERE id = $1`, [params.id])
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

    const updatedRates = await query(`
      UPDATE exchange_rates 
      SET rate = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [Number.parseFloat(rate), params.id])

    return NextResponse.json(updatedRates[0])
  } catch (error) {
    console.error("Error updating exchange rate:", error)
    return NextResponse.json({ error: "Failed to update exchange rate" }, { status: 500 })
  }
}