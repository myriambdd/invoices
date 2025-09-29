"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { MoveHorizontal as MoreHorizontal, FileText, Building, Calendar, DollarSign, Eye, CreditCard as Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface InvoiceWithDetails {
  id: string
  invoice_number?: string
  supplier_name: string
  issue_date?: string
  due_date?: string
  total_amount: number
  total_amount_tnd?: number
  currency_code: string
  currency_symbol?: string
  status: "pending" | "paid" | "overdue" | "cancelled"
  created_at: string
}

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchInvoices() // Refresh the list
      }
    } catch (error) {
      console.error("Error updating invoice status:", error)
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          fetchInvoices() // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting invoice:", error)
      }
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Invoices</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">Start by uploading your first invoice.</p>
            <Link href="/upload">
              <Button>Upload Invoice</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const daysUntilDue = invoice.due_date ? getDaysUntilDue(invoice.due_date) : null

                return (
                  <TableRow key={invoice.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{invoice.supplier_name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {invoice.total_amount.toLocaleString()} {invoice.currency_code}
                          </span>
                        </div>
                        {invoice.total_amount_tnd && invoice.currency_code !== "TND" && (
                          <p className="text-sm text-muted-foreground">
                            ≈ {invoice.total_amount_tnd.toLocaleString()} TND
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select value={invoice.status} onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}>
                        <SelectTrigger className="w-auto border-none p-0 h-auto">
                          {getStatusBadge(invoice.status)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "-"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}</span>
                        {daysUntilDue !== null && invoice.status === "pending" && (
                          <Badge
                            variant={daysUntilDue <= 0 ? "destructive" : daysUntilDue <= 7 ? "secondary" : "outline"}
                          >
                            {daysUntilDue <= 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteInvoice(invoice.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
