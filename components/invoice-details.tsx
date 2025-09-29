"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { FileText, Building, Calendar, DollarSign, CreditCard as Edit, Download, Mail, MapPin, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle } from "lucide-react"
import Link from "next/link"

interface InvoiceWithDetails {
  id: string
  invoice_number?: string
  supplier_id: string
  supplier_name: string
  supplier_email?: string
  supplier_address?: string
  issue_date?: string
  due_date?: string
  total_amount: number
  total_amount_tnd?: number
  currency_code: string
  currency_symbol?: string
  exchange_rate?: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  payment_terms?: string
  notes?: string
  original_file_path?: string
  extracted_data?: any
  created_at: string
  updated_at: string
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  tax_rate: number
  tax_amount: number
}

interface InvoiceDetailsProps {
  invoiceId: string
}

export function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoiceDetails()
  }, [invoiceId])

  const fetchInvoiceDetails = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchInvoiceDetails() // Refresh the data
      }
    } catch (error) {
      console.error("Error updating invoice status:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "overdue":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      paid: "status-paid",
      pending: "status-pending",
      overdue: "status-overdue",
      cancelled: "status-cancelled",
    }
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]} variant="outline">
        {status}
      </Badge>
    )
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Invoice not found</h3>
        <p className="text-muted-foreground">The requested invoice could not be found.</p>
      </div>
    )
  }

  const daysUntilDue = invoice.due_date ? getDaysUntilDue(invoice.due_date) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusIcon(invoice.status)}
          <div>
            <h1 className="text-3xl font-bold text-balance">
              {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground text-pretty">Invoice from {invoice.supplier_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={invoice.status} onValueChange={updateInvoiceStatus}>
            <SelectTrigger className="w-[140px]">{getStatusBadge(invoice.status)}</SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <span className="font-medium capitalize">{invoice.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}
                    </span>
                    {daysUntilDue !== null && invoice.status === "pending" && (
                      <Badge variant={daysUntilDue <= 0 ? "destructive" : daysUntilDue <= 7 ? "secondary" : "outline"}>
                        {daysUntilDue <= 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <CurrencyDisplay 
                    amount={invoice.total_amount} 
                    currency={invoice.currency_code}
                    className="flex items-center gap-2"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-medium">{invoice.payment_terms || "-"}</p>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.items && invoice.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax Rate</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay 
                            amount={item.unit_price} 
                            currency={invoice.currency_code}
                            showOriginalOnly={true}
                          />
                        </TableCell>
                        <TableCell className="text-right">{item.tax_rate}%</TableCell>
                        <TableCell className="text-right font-medium">
                          <CurrencyDisplay 
                            amount={item.total_price} 
                            currency={invoice.currency_code}
                            showOriginalOnly={true}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supplier Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link
                  href={`/suppliers/${invoice.supplier_id}`}
                  className="font-bold text-lg hover:text-primary transition-colors"
                >
                  {invoice.supplier_name}
                </Link>
              </div>

              {invoice.supplier_email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{invoice.supplier_email}</span>
                </div>
              )}

              {invoice.supplier_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{invoice.supplier_address}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Invoice Timeline</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{new Date(invoice.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Original File */}
          {invoice.original_file_path && (
            <Card>
              <CardHeader>
                <CardTitle>Original File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Original Invoice</p>
                      <p className="text-sm text-muted-foreground">{invoice.original_file_path.split("/").pop()}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
