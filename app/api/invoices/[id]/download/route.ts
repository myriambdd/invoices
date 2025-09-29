import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [invoice] = await sql`
      SELECT original_file_path, invoice_number FROM invoices WHERE id = ${params.id}
    `

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!invoice.original_file_path) {
      return NextResponse.json({ error: "No file associated with this invoice" }, { status: 404 })
    }

    // Check if file exists
    if (!fs.existsSync(invoice.original_file_path)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(invoice.original_file_path)
    const fileName = `invoice-${invoice.invoice_number || params.id}.pdf`

    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading invoice:", error)
    return NextResponse.json({ error: "Failed to download invoice" }, { status: 500 })
  }
}