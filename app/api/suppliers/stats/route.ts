import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const suppliers = await sql`
      SELECT 
        s.*,
        COUNT(i.id) as invoice_count,
        COALESCE(SUM(i.total_amount_tnd), 0) as total_amount_tnd,
        MAX(i.issue_date) as last_invoice_date
      FROM suppliers s
      LEFT JOIN invoices i ON s.id = i.supplier_id
      GROUP BY s.id, s.name, s.email, s.phone, s.address, s.tax_id, s.iban, s.bic, s.rib, s.created_at, s.updated_at
      ORDER BY s.name ASC
    `

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Error fetching suppliers with stats:", error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}