import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import { PythonInvoiceExtractor } from "@/lib/python-integration"
import { withClient } from "@/lib/database"

export const runtime = "nodejs" // pas edge, on spawn un process Python

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
    const shouldSave = url.searchParams.get("save") === "1"  // ?save=1 => persist

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

/**
 * Persistance via node-postgres (pg) avec transaction.
 * - upsert supplier par tax_id si dispo, sinon fallback name+email
 * - insert invoice + items
 * - reminder si due_date
 */
async function persistExtraction(extracted: Extracted) {
  const s = extracted.supplier ?? {}
  const inv = extracted.invoice ?? {}
  const items = Array.isArray(extracted.items) ? extracted.items : []

  return withClient(async (client) => {
    await client.query("BEGIN")

    try {
      // 1) Supplier upsert (cas 1: tax_id présent)
      let supplierId: string | null = null

      if (s.tax_id) {
        const upsertByTaxId = await client.query<{
          id: string
        }>(
          `
          INSERT INTO supplier (name, tax_id, email, phone, address, iban, bic, rib)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (tax_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            iban = EXCLUDED.iban,
            bic = EXCLUDED.bic,
            rib = EXCLUDED.rib,
            updated_at = NOW()
          RETURNING id
          `,
          [
            s.name ?? "Unknown supplier",
            s.tax_id,
            s.email ?? null,
            s.phone ?? null,
            s.address ?? null,
            s.iban ?? null,
            s.bic ?? null,
            s.rib ?? null,
          ]
        )
        supplierId = upsertByTaxId.rows[0].id
      } else {
        // 2) Pas de tax_id → on essaie name+email
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM supplier WHERE name = $1 AND COALESCE(email,'') = COALESCE($2,'') LIMIT 1`,
          [s.name ?? "Unknown supplier", s.email ?? null]
        )
        if (existing.rowCount) {
          supplierId = existing.rows[0].id
          await client.query(
            `UPDATE supplier
             SET phone = COALESCE($2, phone),
                 address = COALESCE($3, address),
                 iban = COALESCE($4, iban),
                 bic = COALESCE($5, bic),
                 rib = COALESCE($6, rib),
                 updated_at = NOW()
             WHERE id = $1`,
            [supplierId, s.phone ?? null, s.address ?? null, s.iban ?? null, s.bic ?? null, s.rib ?? null]
          )
        } else {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO supplier (name, email, phone, address, iban, bic, rib)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING id`,
            [
              s.name ?? "Unknown supplier",
              s.email ?? null,
              s.phone ?? null,
              s.address ?? null,
              s.iban ?? null,
              s.bic ?? null,
              s.rib ?? null,
            ]
          )
          supplierId = inserted.rows[0].id
        }
      }

      // 3) Invoice insert
      const invRes = await client.query<{ id: string }>(
        `INSERT INTO invoice
           (supplier_id, number, date, due_date, payment_terms, currency, subtotal, tax_amount, total_amount, status)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,'extracted')
         RETURNING id`,
        [
          supplierId,
          inv.number ?? null,
          inv.date ?? null,
          inv.due_date ?? null,
          inv.payment_terms ?? null,
          inv.currency ?? null,
          inv.subtotal ?? null,
          inv.tax_amount ?? null,
          inv.total_amount ?? null,
        ]
      )
      const invoiceId = invRes.rows[0].id

      // 4) Invoice items
      if (items.length) {
        const text = `
          INSERT INTO invoice_item (invoice_id, description, quantity, unit_price, total_price, tax_rate)
          VALUES ($1,$2,$3,$4,$5,$6)
        `
        for (const it of items) {
          await client.query(text, [
            invoiceId,
            it.description ?? null,
            it.quantity ?? null,
            it.unit_price ?? null,
            it.total_price ?? null,
            it.tax_rate ?? null,
          ])
        }
      }

      // 5) Reminder si due_date
      if (inv.due_date) {
        await client.query(
          `INSERT INTO payment_reminder (invoice_id, due_date, channel, status)
           VALUES ($1, $2, 'email', 'pending')`,
          [invoiceId, inv.due_date]
        )
      }

      await client.query("COMMIT")

      return { supplierId, invoiceId, items: items.length }
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    }
  })
}
