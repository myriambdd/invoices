"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Landmark,
  FileText,
  TrendingUp,
  DollarSign,
  Edit,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import type { Supplier, Invoice } from "@/lib/db"

interface SupplierDetailsProps {
  supplierId: string
}

interface SupplierWithStats extends Supplier {
  invoice_count: number
  total_amount_tnd: number
  avg_amount_tnd: number
  last_invoice_date: string
  pending_amount_tnd: number
  paid_amount_tnd: number
}

export function SupplierDetails({ supplierId }: SupplierDetailsProps) {
  const [supplier, setSupplier] = useState<SupplierWithStats | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSupplierDetails()
  }, [supplierId])

  const fetchSupplierDetails = async () => {
    try {
      const [supplierResponse, invoicesResponse] = await Promise.all([
        fetch(`/api/suppliers/${supplierId}/stats`),
        fetch(`/api/invoices?supplier_id=${supplierId}`),
      ])

      if (supplierResponse.ok && invoicesResponse.ok) {
        const supplierData = await supplierResponse.json()
        const invoicesData = await invoicesResponse.json()

        setSupplier(supplierData)
        setInvoices(invoicesData)
      }
    } catch (error) {
      console.error("Error fetching supplier details:", error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-8">
        <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Supplier not found</h3>
        <p className="text-muted-foreground">The requested supplier could not be found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">{supplier.name}</h1>
          <p className="text-muted-foreground text-pretty">Supplier details and statistics</p>
        </div>
        <Link href={`/suppliers/${supplierId}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Supplier
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.invoice_count}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.total_amount_tnd?.toLocaleString()} TND</div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Invoice</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.avg_amount_tnd?.toLocaleString()} TND</div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplier.pending_amount_tnd?.toLocaleString()} TND</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{supplier.email}</span>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{supplier.phone}</span>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{supplier.address}</span>
                </div>
              )}

              {supplier.tax_id && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tax ID</p>
                      <p className="text-sm text-muted-foreground">{supplier.tax_id}</p>
                    </div>
                  </div>
                </>
              )}

              {(supplier.iban || supplier.bic || supplier.rib) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Banking Information</span>
                    </div>

                    {supplier.iban && (
                      <div className="ml-6">
                        <p className="text-xs text-muted-foreground">IBAN</p>
                        <p className="text-sm font-mono">{supplier.iban}</p>
                      </div>
                    )}

                    {supplier.bic && (
                      <div className="ml-6">
                        <p className="text-xs text-muted-foreground">BIC/SWIFT</p>
                        <p className="text-sm font-mono">{supplier.bic}</p>
                      </div>
                    )}

                    {supplier.rib && (
                      <div className="ml-6">
                        <p className="text-xs text-muted-foreground">RIB</p>
                        <p className="text-sm font-mono">{supplier.rib}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                  <p className="text-muted-foreground">This supplier has no invoices yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>{invoice.total_amount_tnd?.toLocaleString()} TND</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
