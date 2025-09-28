"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react"

interface ExtractedData {
  invoice_number: string | null
  invoice_date: string | null
  supplier_name: string | null
  supplier_tax_id: string | null
  currency: string | null
  amount_ht: number | null
  amount_tva: number | null
  amount_ttc: number | null
  payment_terms: string | null
  payment_method: string | null
  iban: string | null
  bic: string | null
  rib: string | null
  due_date: string | null
  due_date_exists: boolean
  buyer_name: string | null
  buyer_tax_id: string | null
  lines: Array<{
    description: string | null
    qty: number | null
    unit: string | null
    unit_price: number | null
    total: number | null
  }>
  notes: string | null
  source_path: string
  model: string
}

interface InvoiceExtractorProps {
  file: File
  onExtracted: (data: ExtractedData) => void
  onError: (error: string) => void
}

export function InvoiceExtractorIntegration({ file, onExtracted, onError }: InvoiceExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    setIsExtracting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/invoices/extract", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`)
      }

      const data = await response.json()
      setExtractedData(data)
      onExtracted(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Invoice Extraction
        </CardTitle>
        <CardDescription>Extract invoice information using Google Gemini AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedData && !error && (
          <Button onClick={handleExtract} disabled={isExtracting} className="w-full">
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract Invoice Data"
            )}
          </Button>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Extraction completed successfully</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #:</span>
                    <span>{extractedData.invoice_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{extractedData.invoice_date || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span>{extractedData.supplier_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="outline">{extractedData.currency || "N/A"}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Financial Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount HT:</span>
                    <span>{extractedData.amount_ht ? `${extractedData.amount_ht.toFixed(2)}` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA:</span>
                    <span>{extractedData.amount_tva ? `${extractedData.amount_tva.toFixed(2)}` : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total TTC:</span>
                    <span className="font-semibold">
                      {extractedData.amount_ttc ? `${extractedData.amount_ttc.toFixed(2)}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{extractedData.due_date || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {extractedData.lines && extractedData.lines.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Line Items</h4>
                <div className="space-y-2">
                  {extractedData.lines.map((line, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                      <div className="flex justify-between">
                        <span>{line.description || "N/A"}</span>
                        <span>{line.total ? `${line.total.toFixed(2)}` : "N/A"}</span>
                      </div>
                      {line.qty && line.unit_price && (
                        <div className="text-xs text-muted-foreground">
                          {line.qty} × {line.unit_price.toFixed(2)} {line.unit || ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(extractedData.iban || extractedData.bic || extractedData.rib) && (
              <div>
                <h4 className="font-semibold mb-2">Banking Information</h4>
                <div className="space-y-2 text-sm">
                  {extractedData.iban && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN:</span>
                      <span className="font-mono text-xs">{extractedData.iban}</span>
                    </div>
                  )}
                  {extractedData.bic && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BIC:</span>
                      <span className="font-mono text-xs">{extractedData.bic}</span>
                    </div>
                  )}
                  {extractedData.rib && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RIB:</span>
                      <span className="font-mono text-xs">{extractedData.rib}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
