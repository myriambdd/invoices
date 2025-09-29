import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoices = await query(`
      SELECT i.*, s.name as supplier_name, s.email as supplier_email,
             s.address as supplier_address, c.code as currency_code, c.symbol as currency_symbol,
             CASE 
               WHEN c.code = 'TND' THEN i.total_amount
               ELSE i.total_amount * COALESCE(er.rate, 1)
             END as total_amount_tnd,
             er.rate as exchange_rate
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN currencies c ON i.currency_id = c.id
      LEFT JOIN exchange_rates er ON er.from_currency_id = c.id 
        AND er.to_currency_id = (SELECT id FROM currencies WHERE code = 'TND' LIMIT 1)
      WHERE i.id = $1
    `, [params.id])

    if (!invoices.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get invoice items
    const items = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = $1
      ORDER BY created_at ASC
    `, [params.id])

    return NextResponse.json({ ...invoices[0], items })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      invoice_number,
      supplier_id,
      issue_date,
      due_date,
      total_amount,
      currency_id,
      total_amount_tnd,
      exchange_rate,
      status,
      payment_terms,
      notes,
    } = body

    const invoices = await query(`
      UPDATE invoices 
      SET invoice_number = $1, supplier_id = $2,
          issue_date = $3, due_date = $4, total_amount = $5,
          currency_id = $6, total_amount_tnd = $7,
          exchange_rate = $8, status = $9, payment_terms = $10,
          notes = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      invoice_number, supplier_id, issue_date, due_date, total_amount,
      currency_id, total_amount_tnd, exchange_rate, status, payment_terms,
      notes, params.id
    ])

    if (!invoices.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoices[0])
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete invoice items first (due to foreign key constraint)
    await query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [params.id])

    // Delete the invoice
    const invoices = await query(`
      DELETE FROM invoices WHERE id = $1
      RETURNING *
    `, [params.id])

    if (!invoices.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}