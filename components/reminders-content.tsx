"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Bell, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Plus } from "lucide-react"
import { CurrencyDisplay } from "@/components/currency-display"

interface PaymentReminder {
  id: string
  invoice_id: string
  invoice_number: string
  supplier_name: string
  amount: number
  currency: string
  due_date: string
  days_until_due: number
  status: "upcoming" | "due_today" | "overdue"
  reminder_sent: boolean
  created_at: string
}

export function RemindersContent() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [filteredReminders, setFilteredReminders] = useState<PaymentReminder[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReminders()
  }, [])

  useEffect(() => {
    filterReminders()
  }, [reminders, statusFilter])

  const fetchReminders = async () => {
    try {
      // Mock data - in a real app, this would come from your API
      const mockReminders: PaymentReminder[] = [
        {
          id: "1",
          invoice_id: "inv-001",
          invoice_number: "INV-2024-001",
          supplier_name: "Tech Solutions Ltd",
          amount: 1250.0,
          currency: "EUR",
          due_date: "2024-01-15",
          days_until_due: 0,
          status: "due_today",
          reminder_sent: true,
          created_at: "2024-01-10",
        },
        {
          id: "2",
          invoice_id: "inv-002",
          invoice_number: "INV-2024-002",
          supplier_name: "Office Supplies Co",
          amount: 450.0,
          currency: "TND",
          due_date: "2024-01-10",
          days_until_due: -5,
          status: "overdue",
          reminder_sent: true,
          created_at: "2024-01-05",
        },
        {
          id: "3",
          invoice_id: "inv-003",
          invoice_number: "INV-2024-003",
          supplier_name: "Marketing Agency",
          amount: 2800.0,
          currency: "USD",
          due_date: "2024-01-20",
          days_until_due: 5,
          status: "upcoming",
          reminder_sent: false,
          created_at: "2024-01-12",
        },
        {
          id: "4",
          invoice_id: "inv-004",
          invoice_number: "INV-2024-004",
          supplier_name: "Logistics Partner",
          amount: 750.0,
          currency: "TND",
          due_date: "2024-01-18",
          days_until_due: 3,
          status: "upcoming",
          reminder_sent: false,
          created_at: "2024-01-13",
        },
      ]

      setReminders(mockReminders)
    } catch (error) {
      console.error("Error fetching reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterReminders = () => {
    let filtered = reminders
    if (statusFilter !== "all") {
      filtered = reminders.filter((reminder) => reminder.status === statusFilter)
    }
    setFilteredReminders(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "due_today":
        return <Badge variant="default">Due Today</Badge>
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "due_today":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "upcoming":
        return <Bell className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const handleSendReminder = async (reminderId: string) => {
    try {
      // In a real app, this would send an email/SMS reminder
      console.log("Sending reminder for:", reminderId)

      // Update the reminder status
      setReminders((prev) =>
        prev.map((reminder) => (reminder.id === reminderId ? { ...reminder, reminder_sent: true } : reminder)),
      )
    } catch (error) {
      console.error("Error sending reminder:", error)
    }
  }

  const handleMarkPaid = async (reminderId: string) => {
    try {
      // In a real app, this would update the invoice status
      console.log("Marking as paid:", reminderId)

      // Remove the reminder from the list
      setReminders((prev) => prev.filter((reminder) => reminder.id !== reminderId))
    } catch (error) {
      console.error("Error marking as paid:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const overdueCount = reminders.filter((r) => r.status === "overdue").length
  const dueTodayCount = reminders.filter((r) => r.status === "due_today").length
  const upcomingCount = reminders.filter((r) => r.status === "upcoming").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Payment Reminders</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Reminder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Payments overdue</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dueTodayCount}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Upcoming payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due_today">Due Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.map((reminder) => (
          <Card key={reminder.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(reminder.status)}
                  <div>
                    <h3 className="font-semibold">{reminder.supplier_name}</h3>
                    <p className="text-sm text-muted-foreground">Invoice #{reminder.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(reminder.due_date).toLocaleDateString()}
                      {reminder.days_until_due !== 0 && (
                        <span className={`ml-2 ${reminder.days_until_due < 0 ? "text-red-600" : "text-blue-600"}`}>
                          (
                          {reminder.days_until_due < 0
                            ? `${Math.abs(reminder.days_until_due)} days overdue`
                            : `${reminder.days_until_due} days remaining`}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <CurrencyDisplay amount={reminder.amount} currency={reminder.currency} />
                    {getStatusBadge(reminder.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    {!reminder.reminder_sent && (
                      <Button variant="outline" size="sm" onClick={() => handleSendReminder(reminder.id)}>
                        <Bell className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkPaid(reminder.id)}
                      className="text-green-600 hover:text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Paid
                    </Button>
                  </div>
                </div>
              </div>

              {reminder.reminder_sent && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Reminder sent
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReminders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No reminders found</p>
            <p className="text-muted-foreground">All payments are up to date!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}