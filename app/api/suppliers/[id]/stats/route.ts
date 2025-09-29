import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [supplier] = await sql`
      SELECT 
        s.*,
        COUNT(i.id) as invoice_count,
        COALESCE(SUM(i.total_amount_tnd), 0) as total_amount_tnd,
        COALESCE(AVG(i.total_amount_tnd), 0) as avg_amount_tnd,
        MAX(i.issue_date) as last_invoice_date,
        COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.total_amount_tnd ELSE 0 END), 0) as pending_amount_tnd,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount_tnd ELSE 0 END), 0) as paid_amount_tnd
      FROM suppliers s
      LEFT JOIN invoices i ON s.id = i.supplier_id
      WHERE s.id = ${params.id}
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.tax_id, s.iban, s.bic, s.rib, s.created_at, s.updated_at
    `

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("Error fetching supplier stats:", error)
    return NextResponse.json({ error: "Failed to fetch supplier stats" }, { status: 500 })
  }
}