import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SuppliersTable } from "@/components/suppliers-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SuppliersPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">Suppliers</h1>
                <p className="text-muted-foreground text-pretty">Manage your suppliers and view their statistics</p>
              </div>
              <Link href="/suppliers/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </Link>
            </div>

            <SuppliersTable />
          </div>
        </main>
      </div>
    </div>
  )
}
