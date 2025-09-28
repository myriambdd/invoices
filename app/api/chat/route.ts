import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

// Mock data - in a real app, this would come from your database
const mockInvoices = [
  {
    id: "1",
    invoice_number: "INV-2024-001",
    supplier_name: "Tech Solutions Ltd",
    total_amount: 1250.0,
    currency: "EUR",
    due_date: "2024-01-15",
    status: "pending",
    created_at: "2024-01-01",
  },
  {
    id: "2",
    invoice_number: "INV-2024-002",
    supplier_name: "Office Supplies Co",
    total_amount: 450.0,
    currency: "TND",
    due_date: "2024-01-10",
    status: "overdue",
    created_at: "2023-12-15",
  },
  {
    id: "3",
    invoice_number: "INV-2024-003",
    supplier_name: "Marketing Agency",
    total_amount: 2800.0,
    currency: "USD",
    due_date: "2024-01-20",
    status: "pending",
    created_at: "2024-01-05",
  },
]

const mockSuppliers = [
  { id: "1", name: "Tech Solutions Ltd", invoice_count: 5, total_amount: 6250.0 },
  { id: "2", name: "Office Supplies Co", invoice_count: 12, total_amount: 3400.0 },
  { id: "3", name: "Marketing Agency", invoice_count: 3, total_amount: 8400.0 },
  { id: "4", name: "Logistics Partner", invoice_count: 8, total_amount: 4200.0 },
  { id: "5", name: "Software Vendor", invoice_count: 2, total_amount: 5600.0 },
]

function analyzeQuery(message: string): { intent: string; timeframe?: string; entity?: string } {
  const lowerMessage = message.toLowerCase()

  // Time-based queries
  if (lowerMessage.includes("today")) return { intent: "due_payments", timeframe: "today" }
  if (lowerMessage.includes("this week") || lowerMessage.includes("week"))
    return { intent: "due_payments", timeframe: "week" }
  if (lowerMessage.includes("this month") || lowerMessage.includes("month"))
    return { intent: "due_payments", timeframe: "month" }

  // Supplier queries
  if (lowerMessage.includes("supplier") || lowerMessage.includes("vendor")) return { intent: "suppliers" }
  if (lowerMessage.includes("top")) return { intent: "top_suppliers" }

  // Status queries
  if (lowerMessage.includes("overdue")) return { intent: "overdue_invoices" }
  if (lowerMessage.includes("paid")) return { intent: "paid_invoices" }
  if (lowerMessage.includes("pending")) return { intent: "pending_invoices" }

  // Summary queries
  if (lowerMessage.includes("total") || lowerMessage.includes("amount") || lowerMessage.includes("summary"))
    return { intent: "summary" }

  return { intent: "general" }
}

function getInvoicesByTimeframe(timeframe: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return mockInvoices.filter((invoice) => {
    const dueDate = new Date(invoice.due_date)

    switch (timeframe) {
      case "today":
        return dueDate.toDateString() === today.toDateString()
      case "week":
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        return dueDate >= today && dueDate <= weekFromNow
      case "month":
        const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
        return dueDate >= today && dueDate <= monthFromNow
      default:
        return false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const analysis = analyzeQuery(message)

    const responseData: any = {}
    let responseMessage = ""

    switch (analysis.intent) {
      case "due_payments":
        const dueInvoices = getInvoicesByTimeframe(analysis.timeframe!)
        responseData.invoices = dueInvoices
        responseMessage = `Found ${dueInvoices.length} invoice(s) due ${analysis.timeframe}:`
        break

      case "overdue_invoices":
        const overdueInvoices = mockInvoices.filter((inv) => inv.status === "overdue")
        responseData.invoices = overdueInvoices
        responseMessage = `You have ${overdueInvoices.length} overdue invoice(s):`
        break

      case "pending_invoices":
        const pendingInvoices = mockInvoices.filter((inv) => inv.status === "pending")
        responseData.invoices = pendingInvoices
        responseMessage = `You have ${pendingInvoices.length} pending invoice(s):`
        break

      case "top_suppliers":
        const topSuppliers = mockSuppliers.sort((a, b) => b.total_amount - a.total_amount).slice(0, 5)
        responseData.suppliers = topSuppliers
        responseMessage = "Here are your top 5 suppliers by total amount:"
        break

      case "suppliers":
        responseData.suppliers = mockSuppliers
        responseMessage = "Here are all your suppliers:"
        break

      case "summary":
        const totalAmount = mockInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
        const pendingCount = mockInvoices.filter((inv) => inv.status === "pending").length
        const overdueCount = mockInvoices.filter((inv) => inv.status === "overdue").length
        const paidCount = mockInvoices.filter((inv) => inv.status === "paid").length

        responseData.summary = {
          total_amount: `${totalAmount.toFixed(2)} TND`,
          pending_invoices: pendingCount,
          overdue_invoices: overdueCount,
          paid_invoices: paidCount,
        }
        responseMessage = "Here's a summary of your invoices:"
        break

      default:
        // Use AI for general queries
        const { text } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `You are an invoice management assistant. The user asked: "${message}". 
          
          Based on the invoice data available, provide a helpful response. You can help with:
          - Invoice due dates and payment tracking
          - Supplier information and statistics  
          - Financial summaries and reporting
          - Payment reminders and overdue invoices
          
          Keep responses concise and actionable. If you need specific data, suggest what the user should ask for.`,
        })
        responseMessage = text
        break
    }

    return NextResponse.json({
      message: responseMessage,
      data: responseData,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
