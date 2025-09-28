import { type NextRequest, NextResponse } from "next/server"

// Mock data for article statistics
const mockArticleStats = [
  {
    id: "1",
    name: "Office Paper A4",
    category: "Office Supplies",
    total_quantity: 500,
    avg_price: 12.5,
    price_trend: "up" as const,
    suppliers: [
      {
        supplier_name: "Office Supplies Co",
        avg_price: 12.0,
        quantity: 200,
        last_purchase: "2024-01-10",
      },
      {
        supplier_name: "Paper World",
        avg_price: 13.0,
        quantity: 300,
        last_purchase: "2024-01-15",
      },
    ],
    price_history: [
      { date: "2023-07", price: 11.5, supplier: "Office Supplies Co" },
      { date: "2023-08", price: 11.8, supplier: "Office Supplies Co" },
      { date: "2023-09", price: 12.0, supplier: "Paper World" },
      { date: "2023-10", price: 12.2, supplier: "Office Supplies Co" },
      { date: "2023-11", price: 12.5, supplier: "Paper World" },
      { date: "2023-12", price: 12.8, supplier: "Office Supplies Co" },
    ],
  },
  {
    id: "2",
    name: "Laptop Dell XPS",
    category: "Technology",
    total_quantity: 25,
    avg_price: 1250.0,
    price_trend: "down" as const,
    suppliers: [
      {
        supplier_name: "Tech Solutions Ltd",
        avg_price: 1200.0,
        quantity: 15,
        last_purchase: "2024-01-05",
      },
      {
        supplier_name: "Computer World",
        avg_price: 1300.0,
        quantity: 10,
        last_purchase: "2023-12-20",
      },
    ],
    price_history: [
      { date: "2023-07", price: 1350.0, supplier: "Tech Solutions Ltd" },
      { date: "2023-08", price: 1320.0, supplier: "Computer World" },
      { date: "2023-09", price: 1300.0, supplier: "Tech Solutions Ltd" },
      { date: "2023-10", price: 1280.0, supplier: "Computer World" },
      { date: "2023-11", price: 1250.0, supplier: "Tech Solutions Ltd" },
      { date: "2023-12", price: 1200.0, supplier: "Tech Solutions Ltd" },
    ],
  },
  {
    id: "3",
    name: "Coffee Beans Premium",
    category: "Food & Beverage",
    total_quantity: 100,
    avg_price: 25.0,
    price_trend: "stable" as const,
    suppliers: [
      {
        supplier_name: "Coffee Roasters Inc",
        avg_price: 24.5,
        quantity: 60,
        last_purchase: "2024-01-12",
      },
      {
        supplier_name: "Bean Masters",
        avg_price: 25.5,
        quantity: 40,
        last_purchase: "2024-01-08",
      },
    ],
    price_history: [
      { date: "2023-07", price: 25.0, supplier: "Coffee Roasters Inc" },
      { date: "2023-08", price: 24.8, supplier: "Bean Masters" },
      { date: "2023-09", price: 25.2, supplier: "Coffee Roasters Inc" },
      { date: "2023-10", price: 25.0, supplier: "Bean Masters" },
      { date: "2023-11", price: 24.9, supplier: "Coffee Roasters Inc" },
      { date: "2023-12", price: 25.1, supplier: "Bean Masters" },
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "6months"

    // In a real app, you would filter data based on timeframe
    // For now, we'll return all mock data

    return NextResponse.json(mockArticleStats)
  } catch (error) {
    console.error("Error fetching article analytics:", error)
    return NextResponse.json({ error: "Failed to fetch article analytics" }, { status: 500 })
  }
}
