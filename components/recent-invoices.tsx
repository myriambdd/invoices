import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

const recentInvoices = [
  {
    id: "INV-001",
    supplier: "Tech Solutions SARL",
    amount: "2,450.00",
    currency: "TND",
    status: "paid" as const,
    dueDate: "2024-01-15",
  },
  {
    id: "INV-002",
    supplier: "Office Supplies Co",
    amount: "890.50",
    currency: "EUR",
    status: "pending" as const,
    dueDate: "2024-01-20",
  },
  {
    id: "INV-003",
    supplier: "Equipment Import Ltd",
    amount: "5,200.00",
    currency: "USD",
    status: "overdue" as const,
    dueDate: "2024-01-10",
  },
]

const statusStyles = {
  paid: "status-paid",
  pending: "status-pending",
  overdue: "status-overdue",
  cancelled: "status-cancelled",
}

export function RecentInvoices() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.supplier}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium">
                    {invoice.amount} {invoice.currency}
                  </p>
                  <p className="text-sm text-muted-foreground">Due: {invoice.dueDate}</p>
                </div>
                <Badge className={statusStyles[invoice.status]} variant="outline">
                  {invoice.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
