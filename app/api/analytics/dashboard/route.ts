import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get dashboard statistics
    const [stats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
        (SELECT COALESCE(SUM(total_amount_tnd), 0) FROM invoices WHERE 
         EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND
         EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as monthly_total_tnd
    `

    // Get recent invoices
    const recentInvoices = await sql`
      SELECT i.*, s.name as supplier_name, c.code as currency_code
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN currencies c ON i.currency_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `

    // Get upcoming payments
    const upcomingPayments = await sql`
      SELECT i.*, s.name as supplier_name, c.code as currency_code,
             (i.due_date - CURRENT_DATE) as days_until_due
      FROM invoices i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN currencies c ON i.currency_id = c.id
      WHERE i.status = 'pending' AND i.due_date >= CURRENT_DATE
      ORDER BY i.due_date ASC
      LIMIT 5
    `

    return NextResponse.json({
      stats,
      recent_invoices: recentInvoices,
      upcoming_payments: upcomingPayments,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}