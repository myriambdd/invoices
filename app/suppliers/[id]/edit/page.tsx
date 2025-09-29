import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SupplierForm } from "@/components/supplier-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditSupplierPageProps {
  params: {
    id: string
  }
}

export default function EditSupplierPage({ params }: EditSupplierPageProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Link href={`/suppliers/${params.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-balance">Edit Supplier</h1>
                <p className="text-muted-foreground text-pretty">Update supplier information</p>
              </div>
            </div>

            <SupplierForm supplierId={params.id} isEditing={true} />
          </div>
        </main>
      </div>
    </div>
  )
}