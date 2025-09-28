import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SupplierDetails } from "@/components/supplier-details"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SupplierPageProps {
  params: {
    id: string
  }
}

export default function SupplierPage({ params }: SupplierPageProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Link href="/suppliers">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suppliers
                </Button>
              </Link>
            </div>

            <SupplierDetails supplierId={params.id} />
          </div>
        </main>
      </div>
    </div>
  )
}
