import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, AlertTriangle, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Invoices",
    value: "1,234",
    change: "+12%",
    changeType: "positive" as const,
    icon: FileText,
  },
  {
    title: "Active Suppliers",
    value: "89",
    change: "+3%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Overdue Payments",
    value: "23",
    change: "-8%",
    changeType: "negative" as const,
    icon: AlertTriangle,
  },
  {
    title: "Monthly Total (TND)",
    value: "45,678",
    change: "+18%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.changeType === "positive" ? "text-success" : "text-destructive"}`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
