import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import { PythonInvoiceExtractor } from "@/lib/python-integration"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

type Extracted = {
  supplier?: {
    name?: string; address?: string; email?: string; phone?: string; tax_id?: string;
    iban?: string; bic?: string; rib?: string;
  };
  invoice?: {
    number?: string; date?: string; due_date?: string; payment_terms?: string;
    currency?: string; total_amount?: number; tax_amount?: number; subtotal?: number;
  };
  items?: Array<{
    description?: string; quantity?: number; unit_price?: number; total_price?: number; tax_rate?: number;
  }>;
  payment_info?: { iban?: string; bic?: string; reference?: string };
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const shouldSave = url.searchParams.get("save") === "1"

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/bmp", "image/tiff"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and image files are allowed." }, { status: 400 })
    }

    const extractor = new PythonInvoiceExtractor()
    const uploadDir = path.join(process.cwd(), "uploads", "invoices")
    const filePath = await extractor.saveUploadedFile(file, uploadDir)

    let extracted: Extracted
    try {
      extracted = await extractor.extractFromFile(filePath)
    } catch (err) {
      console.error("Extraction error:", err)
      return NextResponse.json({ error: `Failed to extract data: ${err}` }, { status: 500 })
    }

    let saved: any = null
    if (shouldSave) {
      saved = await persistExtraction(extracted)
    }

    return NextResponse.json({
      success: true,
      data: extracted,
      file_path: filePath,
      saved,
    })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}

async function persistExtraction(extracted: Extracted) {
  const s = extracted.supplier ?? {}
  const inv = extracted.invoice ?? {}
  const items = Array.isArray(extracted.items) ? extracted.items : []

  try {
    // 1) Supplier upsert
    let supplierId: string | null = null

    if (s.tax_id) {
      const [supplier] = await sql`
        INSERT INTO suppliers (name, tax_id, email, phone, address, iban, bic, rib)
        VALUES (${s.name ?? "Unknown supplier"}, ${s.tax_id}, ${s.email ?? null}, ${s.phone ?? null}, 
                ${s.address ?? null}, ${s.iban ?? null}, ${s.bic ?? null}, ${s.rib ?? null})
        ON CONFLICT (tax_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          iban = EXCLUDED.iban,
          bic = EXCLUDED.bic,
          rib = EXCLUDED.rib,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `
      supplierId = supplier.id
    } else {
      // Try to find by name and email
      const existing = await sql`
        SELECT id FROM suppliers 
        WHERE name = ${s.name ?? "Unknown supplier"} 
        AND COALESCE(email,'') = COALESCE(${s.email ?? null},'') 
        LIMIT 1
      `
      
      if (existing.length > 0) {
        supplierId = existing[0].id
        await sql`
          UPDATE suppliers
          SET phone = COALESCE(${s.phone ?? null}, phone),
              address = COALESCE(${s.address ?? null}, address),
              iban = COALESCE(${s.iban ?? null}, iban),
              bic = COALESCE(${s.bic ?? null}, bic),
              rib = COALESCE(${s.rib ?? null}, rib),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${supplierId}
        `
      } else {
        const [newSupplier] = await sql`
          INSERT INTO suppliers (name, email, phone, address, iban, bic, rib)
          VALUES (${s.name ?? "Unknown supplier"}, ${s.email ?? null}, ${s.phone ?? null}, 
                  ${s.address ?? null}, ${s.iban ?? null}, ${s.bic ?? null}, ${s.rib ?? null})
          RETURNING id
        `
        supplierId = newSupplier.id
      }
    }

    // 2) Get TND currency ID
    const [tndCurrency] = await sql`
      SELECT id FROM currencies WHERE code = 'TND' LIMIT 1
    `

    // 3) Invoice insert
    const [invoice] = await sql`
      INSERT INTO invoices
        (supplier_id, invoice_number, issue_date, due_date, payment_terms, 
         total_amount, currency_id, status, extracted_data)
      VALUES
        (${supplierId}, ${inv.number ?? null}, ${inv.date ?? null}, ${inv.due_date ?? null}, 
         ${inv.payment_terms ?? null}, ${inv.total_amount ?? null}, ${tndCurrency?.id ?? null}, 
         'extracted', ${JSON.stringify(extracted)})
      RETURNING id
    `

    // 4) Invoice items
    if (items.length) {
      for (const it of items) {
        await sql`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price, tax_rate)
          VALUES (${invoice.id}, ${it.description ?? null}, ${it.quantity ?? null}, 
                  ${it.unit_price ?? null}, ${it.total_price ?? null}, ${it.tax_rate ?? null})
        `
      }
    }

    // 5) Reminder if due_date
    if (inv.due_date) {
      await sql`
        INSERT INTO payment_reminders (invoice_id, reminder_date, reminder_type, days_offset)
        VALUES (${invoice.id}, ${inv.due_date}, 'on_due', 0)
      `
    }

    return { supplierId, invoiceId: invoice.id, items: items.length }
  } catch (error) {
    console.error("Error persisting extraction:", error)
    throw error
  }
}