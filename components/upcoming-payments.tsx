import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle } from "lucide-react"

const upcomingPayments = [
  {
    id: "INV-004",
    supplier: "Tech Solutions SARL",
    amount: "1,200.00",
    currency: "TND",
    dueDate: "2024-01-25",
    daysUntilDue: 3,
  },
  {
    id: "INV-005",
    supplier: "Office Supplies Co",
    amount: "750.00",
    currency: "EUR",
    dueDate: "2024-01-28",
    daysUntilDue: 6,
  },
  {
    id: "INV-006",
    supplier: "Equipment Import Ltd",
    amount: "3,400.00",
    currency: "USD",
    dueDate: "2024-02-01",
    daysUntilDue: 10,
  },
]

export function UpcomingPayments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Upcoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {payment.daysUntilDue <= 3 && <AlertTriangle className="w-4 h-4 text-warning" />}
                <div>
                  <p className="font-medium">{payment.id}</p>
                  <p className="text-sm text-muted-foreground">{payment.supplier}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {payment.amount} {payment.currency}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Due: {payment.dueDate}</p>
                  <Badge variant={payment.daysUntilDue <= 3 ? "destructive" : "secondary"}>
                    {payment.daysUntilDue} days
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
