import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const supplierId = searchParams.get("supplier_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT i.*, s.name as supplier_name, c.code as currency_code, c.symbol as currency_symbol,
             CASE 
               WHEN c.code = 'TND' THEN i.total_amount
               ELSE i.total_amount * COALESCE(er.rate, 1)
             END as total_amount_tnd
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN currencies c ON i.currency_id = c.id
      LEFT JOIN exchange_rates er ON er.from_currency_id = c.id 
        AND er.to_currency_id = (SELECT id FROM currencies WHERE code = 'TND' LIMIT 1)
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ` AND i.status = $${params.length + 1}`
      params.push(status)
    }

    if (supplierId) {
      query += ` AND i.supplier_id = $${params.length + 1}`
      params.push(supplierId)
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const invoices = await sql(query, params)
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      status = "pending",
      payment_terms,
      notes,
      original_file_path,
      extracted_data,
      items = [],
    } = body

    if (!supplier_id || !total_amount || !currency_id) {
      return NextResponse.json({ error: "supplier_id, total_amount, and currency_id are required" }, { status: 400 })
    }

    // Create invoice
    const [invoice] = await sql`
      INSERT INTO invoices (
        invoice_number, supplier_id, issue_date, due_date, total_amount,
        currency_id, total_amount_tnd, exchange_rate, status, payment_terms,
        notes, original_file_path, extracted_data
      )
      VALUES (
        ${invoice_number}, ${supplier_id}, ${issue_date}, ${due_date}, ${total_amount},
        ${currency_id}, ${total_amount_tnd}, ${exchange_rate}, ${status}, ${payment_terms},
        ${notes}, ${original_file_path}, ${JSON.stringify(extracted_data)}
      )
      RETURNING *
    `

    // Insert invoice items
    if (items.length > 0) {
      for (const item of items) {
        await sql`
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, total_price, tax_rate, tax_amount
          )
          VALUES (
            ${invoice.id}, ${item.description}, ${item.quantity || 1}, 
            ${item.unit_price}, ${item.total_price}, ${item.tax_rate || 0}, ${item.tax_amount || 0}
          )
        `
      }
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}