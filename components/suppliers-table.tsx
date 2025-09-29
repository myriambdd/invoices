"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoveHorizontal as MoreHorizontal, Building, Mail, Phone, FileText, TrendingUp } from "lucide-react"
import { Eye, CreditCard as Edit, Trash2 } from "lucide-react"downMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import type { Supplier } from "@/lib/db"

interface SupplierWithStats extends Supplier {
  invoice_count?: number
  total_amount_tnd?: number
  last_invoice_date?: string
}

export function SuppliersTable() {
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    const filtered = suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers/stats")
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchSuppliers()
        }
      } catch (error) {
        console.error("Error deleting supplier:", error)
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading suppliers...</p>
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
          <CardTitle>All Suppliers</CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No suppliers match your search." : "Get started by adding your first supplier."}
            </p>
            <Link href="/suppliers/new">
              <Button>Add Supplier</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Total Amount (TND)</TableHead>
                <TableHead>Last Invoice</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {supplier.name}
                        </Link>
                        {supplier.address && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{supplier.address}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.tax_id ? (
                      <Badge variant="outline">{supplier.tax_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{supplier.invoice_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {supplier.total_amount_tnd ? `${supplier.total_amount_tnd.toLocaleString()} TND` : "0 TND"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.last_invoice_date ? (
                      <span className="text-sm">{new Date(supplier.last_invoice_date).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                          <Link href={`/suppliers/${supplier.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/suppliers/${supplier.id}/edit`}>
                          Edit Supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/invoices?supplier_id=${supplier.id}`}>
                          View Invoices
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(supplier.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}