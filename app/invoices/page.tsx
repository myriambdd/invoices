import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { InvoicesTable } from "@/components/invoices-table"
import { InvoiceFilters } from "@/components/invoice-filters"

export default function InvoicesPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">Invoices</h1>
              <p className="text-muted-foreground text-pretty">Manage and track all your invoices</p>
            </div>

            <InvoiceFilters />
            <InvoicesTable />
          </div>
        </main>
      </div>
    </div>
  )
}