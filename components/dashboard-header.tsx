import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Plus } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search invoices, suppliers..." className="pl-10 bg-background/50" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>
    </header>
  )
}
