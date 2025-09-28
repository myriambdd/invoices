"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

interface FilterState {
  search: string
  status: string
  supplier: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  currency: string
}

interface InvoiceFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export function InvoiceFilters({ onFiltersChange }: InvoiceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    supplier: "all",
    dateFrom: undefined,
    dateTo: undefined,
    currency: "all",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: "",
      status: "all",
      supplier: "all",
      dateFrom: undefined,
      dateTo: undefined,
      currency: "all",
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "search") return value.length > 0
      return value !== "all" && value !== undefined
    }).length
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Basic Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Advanced
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto bg-transparent">
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
              <Select value={filters.supplier} onValueChange={(value) => updateFilter("supplier", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="tech-solutions">Tech Solutions SARL</SelectItem>
                  <SelectItem value="office-supplies">Office Supplies Co</SelectItem>
                  <SelectItem value="equipment-import">Equipment Import Ltd</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.currency} onValueChange={(value) => updateFilter("currency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="TND">TND</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
