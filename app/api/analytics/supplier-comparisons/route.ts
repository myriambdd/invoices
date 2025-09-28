import { type NextRequest, NextResponse } from "next/server"

// Mock data for supplier comparisons
const mockSupplierComparisons = [
  {
    article_name: "Office Paper A4",
    suppliers: [
      {
        supplier_name: "Office Supplies Co",
        price: 12.0,
        quantity: 200,
        last_purchase: "2024-01-10",
      },
      {
        supplier_name: "Paper World",
        price: 13.0,
        quantity: 300,
        last_purchase: "2024-01-15",
      },
      {
        supplier_name: "Stationery Plus",
        price: 11.5,
        quantity: 150,
        last_purchase: "2024-01-08",
      },
    ],
  },
  {
    article_name: "Laptop Dell XPS",
    suppliers: [
      {
        supplier_name: "Tech Solutions Ltd",
        price: 1200.0,
        quantity: 15,
        last_purchase: "2024-01-05",
      },
      {
        supplier_name: "Computer World",
        price: 1300.0,
        quantity: 10,
        last_purchase: "2023-12-20",
      },
      {
        supplier_name: "Electronics Hub",
        price: 1180.0,
        quantity: 8,
        last_purchase: "2024-01-12",
      },
    ],
  },
  {
    article_name: "Coffee Beans Premium",
    suppliers: [
      {
        supplier_name: "Coffee Roasters Inc",
        price: 24.5,
        quantity: 60,
        last_purchase: "2024-01-12",
      },
      {
        supplier_name: "Bean Masters",
        price: 25.5,
        quantity: 40,
        last_purchase: "2024-01-08",
      },
      {
        supplier_name: "Gourmet Coffee Co",
        price: 26.0,
        quantity: 25,
        last_purchase: "2024-01-06",
      },
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "6months"

    // In a real app, you would filter data based on timeframe
    // For now, we'll return all mock data

    return NextResponse.json(mockSupplierComparisons)
  } catch (error) {
    console.error("Error fetching supplier comparisons:", error)
    return NextResponse.json({ error: "Failed to fetch supplier comparisons" }, { status: 500 })
  }
}
