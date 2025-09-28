import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Upload,
  MessageSquare,
  Calendar,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Articles", href: "/articles", icon: TrendingUp },
  { name: "Reminders", href: "/reminders", icon: Calendar },
  { name: "Chat Assistant", href: "/chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">InvoiceAI</h2>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User Account</p>
            <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
