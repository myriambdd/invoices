import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { InvoiceDetails } from "@/components/invoice-details"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface InvoicePageProps {
  params: {
    id: string
  }
}

export default function InvoicePage({ params }: InvoicePageProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Invoices
                </Button>
              </Link>
            </div>

            <InvoiceDetails invoiceId={params.id} />
          </div>
        </main>
      </div>
    </div>
  )
}
