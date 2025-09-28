import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { InvoiceUploader } from "@/components/invoice-uploader"

export default function UploadPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">Upload Invoice</h1>
              <p className="text-muted-foreground text-pretty">
                Upload PDF or image files to extract invoice data automatically
              </p>
            </div>

            <InvoiceUploader />
          </div>
        </main>
      </div>
    </div>
  )
}
