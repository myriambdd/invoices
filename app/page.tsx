import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentInvoices } from "@/components/recent-invoices"
import { UpcomingPayments } from "@/components/upcoming-payments"

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
              <p className="text-muted-foreground text-pretty">Overview of your invoice management system</p>
            </div>

            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentInvoices />
              <UpcomingPayments />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}