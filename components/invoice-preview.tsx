"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Edit3, Plus, Trash2, FileText, Building, Calendar, DollarSign, Loader2 } from "lucide-react"
import type { ExtractedInvoiceData } from "@/lib/python-integration"
import type { Supplier, Currency } from "@/lib/db"

interface UploadedFile {
  file: File
  id: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  extractedData?: ExtractedInvoiceData
  filePath?: string
  error?: string
}

interface InvoicePreviewProps {
  file: UploadedFile
  onClose: () => void
}

export function InvoicePreview({ file, onClose }: InvoicePreviewProps) {
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData>(
    file.extractedData || ({} as ExtractedInvoiceData),
  )
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Fetch suppliers and currencies
    Promise.all([
      fetch("/api/suppliers").then((res) => res.json()),
      fetch("/api/currencies").then((res) => res.json()),
    ]).then(([suppliersData, currenciesData]) => {
      setSuppliers(suppliersData)
      setCurrencies(currenciesData)

      // Auto-select currency if found
      if (extractedData.invoice?.currency) {
        const currency = currenciesData.find((c: Currency) => c.code === extractedData.invoice?.currency)
        if (currency) {
          setSelectedCurrencyId(currency.id)
        }
      }

      // Try to match supplier by name
      if (extractedData.supplier?.name) {
        const supplier = suppliersData.find((s: Supplier) =>
          s.name.toLowerCase().includes(extractedData.supplier?.name?.toLowerCase() || ""),
        )
        if (supplier) {
          setSelectedSupplierId(supplier.id)
        }
      }
    })
  }, [extractedData])

  const updateInvoiceField = (field: string, value: any) => {
    setExtractedData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [field]: value,
      },
    }))
  }

  const updateSupplierField = (field: string, value: any) => {
    setExtractedData((prev) => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        [field]: value,
      },
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setExtractedData((prev) => ({
      ...prev,
      items: prev.items?.map((item, i) => (i === index ? { ...item, [field]: value } : item)) || [],
    }))
  }

  const addItem = () => {
    setExtractedData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          tax_rate: 0,
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    setExtractedData((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Get currency for conversion
      const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId)
      
      // Create invoice
      const invoiceData = {
        invoice_number: extractedData.invoice?.number,
        supplier_id: selectedSupplierId,
        issue_date: extractedData.invoice?.date,
        due_date: extractedData.invoice?.due_date,
        total_amount: extractedData.invoice?.total_amount,
        currency_id: selectedCurrencyId,
        total_amount_tnd: extractedData.invoice?.total_amount, // Will be converted by backend
        exchange_rate: 1, // Will be calculated by backend
        payment_terms: extractedData.invoice?.payment_terms,
        original_file_path: file.filePath,
        extracted_data: extractedData,
        items: extractedData.items || [],
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        onClose()
        // Could add a success toast here
      } else {
        throw new Error("Failed to save invoice")
      }
    } catch (error) {
      console.error("Error saving invoice:", error)
      // Could add an error toast here
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Preview - {file.file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Original File Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Original File</h3>
              <Badge variant="outline">{file.file.type === "application/pdf" ? "PDF" : "Image"}</Badge>
            </div>

            <Card className="h-96">
              <CardContent className="p-4 h-full">
                {file.file.type === "application/pdf" ? (
                  <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">PDF Preview</p>
                      <p className="text-xs text-muted-foreground mt-1">{file.file.name}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(file.file) || "/placeholder.svg"}
                    alt="Invoice preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Extracted Data */}
          <ScrollArea className="h-96">
            <div className="space-y-6 pr-4">
              {/* Invoice Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="w-4 h-4" />
                    Invoice Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoice-number">Invoice Number</Label>
                      <Input
                        id="invoice-number"
                        value={extractedData.invoice?.number || ""}
                        onChange={(e) => updateInvoiceField("number", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={selectedCurrencyId} onValueChange={setSelectedCurrencyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issue-date">Issue Date</Label>
                      <Input
                        id="issue-date"
                        type="date"
                        value={extractedData.invoice?.date || ""}
                        onChange={(e) => updateInvoiceField("date", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={extractedData.invoice?.due_date || ""}
                        onChange={(e) => updateInvoiceField("due_date", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="total-amount">Total Amount</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      step="0.01"
                      value={extractedData.invoice?.total_amount || ""}
                      onChange={(e) => updateInvoiceField("total_amount", Number.parseFloat(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="w-4 h-4" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="supplier">Select Supplier</Label>
                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or create supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier-name">Name</Label>
                    <Input
                      id="supplier-name"
                      value={extractedData.supplier?.name || ""}
                      onChange={(e) => updateSupplierField("name", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier-address">Address</Label>
                    <Textarea
                      id="supplier-address"
                      value={extractedData.supplier?.address || ""}
                      onChange={(e) => updateSupplierField("address", e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="w-4 h-4" />
                      Invoice Items
                    </CardTitle>
                    {isEditing && (
                      <Button size="sm" onClick={addItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {extractedData.items?.map((item, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          {isEditing && (
                            <Button size="sm" variant="outline" onClick={() => removeItem(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Input
                            value={item.description || ""}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price || ""}
                              onChange={(e) => updateItem(index, "unit_price", Number.parseFloat(e.target.value))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.total_price || ""}
                              onChange={(e) => updateItem(index, "total_price", Number.parseFloat(e.target.value))}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground text-center py-4">No items found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? "Stop Editing" : "Edit"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !selectedSupplierId || !selectedCurrencyId}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
