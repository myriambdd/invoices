import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || items.length < 2) {
      return NextResponse.json({ error: "At least 2 items required for merging" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Validate that all items exist
    // 2. Merge the articles in the database
    // 3. Update all related invoice_items to point to the merged article
    // 4. Delete the old articles
    // 5. Recalculate statistics

    console.log("Merging articles:", items)

    // Simulate successful merge
    return NextResponse.json({
      success: true,
      message: `Successfully merged ${items.length} articles`,
      merged_id: items[0], // In real app, this would be the ID of the merged article
    })
  } catch (error) {
    console.error("Error merging articles:", error)
    return NextResponse.json({ error: "Failed to merge articles" }, { status: 500 })
  }
}
