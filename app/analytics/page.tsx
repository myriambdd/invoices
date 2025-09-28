"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, BarChart3, PieChartIcon, Users, Package, ArrowUpDown, Merge } from "lucide-react"
import { CurrencyDisplay } from "@/components/currency-display"

interface ArticleStats {
  id: string
  name: string
  category: string
  total_quantity: number
  avg_price: number
  price_trend: "up" | "down" | "stable"
  suppliers: Array<{
    supplier_name: string
    avg_price: number
    quantity: number
    last_purchase: string
  }>
  price_history: Array<{
    date: string
    price: number
    supplier: string
  }>
}

interface SupplierComparison {
  article_name: string
  suppliers: Array<{
    supplier_name: string
    price: number
    quantity: number
    last_purchase: string
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const [articleStats, setArticleStats] = useState<ArticleStats[]>([])
  const [supplierComparisons, setSupplierComparisons] = useState<SupplierComparison[]>([])
  const [selectedArticle, setSelectedArticle] = useState<string>("")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("6months")
  const [loading, setLoading] = useState(true)
  const [mergeMode, setMergeMode] = useState<"articles" | "suppliers" | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeframe])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [articlesRes, comparisonsRes] = await Promise.all([
        fetch(`/api/analytics/articles?timeframe=${selectedTimeframe}`),
        fetch(`/api/analytics/supplier-comparisons?timeframe=${selectedTimeframe}`),
      ])

      const articlesData = await articlesRes.json()
      const comparisonsData = await comparisonsRes.json()

      setArticleStats(articlesData)
      setSupplierComparisons(comparisonsData)
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMergeItems = async () => {
    if (selectedItems.length < 2) return

    try {
      const endpoint = mergeMode === "articles" ? "/api/analytics/merge-articles" : "/api/analytics/merge-suppliers"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      })

      if (response.ok) {
        setSelectedItems([])
        setMergeMode(null)
        fetchAnalyticsData()
      }
    } catch (error) {
      console.error("Error merging items:", error)
    }
  }

  const selectedArticleData = articleStats.find((article) => article.id === selectedArticle)

  const categoryData = articleStats.reduce(
    (acc, article) => {
      const existing = acc.find((item) => item.category === article.category)
      if (existing) {
        existing.count += 1
        existing.total_value += article.avg_price * article.total_quantity
      } else {
        acc.push({
          category: article.category,
          count: 1,
          total_value: article.avg_price * article.total_quantity,
        })
      }
      return acc
    },
    [] as Array<{ category: string; count: number; total_value: number }>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={mergeMode === "articles" ? "default" : "outline"}
            onClick={() => setMergeMode(mergeMode === "articles" ? null : "articles")}
          >
            <Merge className="h-4 w-4 mr-2" />
            Merge Articles
          </Button>
          <Button
            variant={mergeMode === "suppliers" ? "default" : "outline"}
            onClick={() => setMergeMode(mergeMode === "suppliers" ? null : "suppliers")}
          >
            <Users className="h-4 w-4 mr-2" />
            Merge Suppliers
          </Button>
        </div>
      </div>

      {/* Merge Mode Controls */}
      {mergeMode && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              Merge {mergeMode === "articles" ? "Articles" : "Suppliers"}
            </CardTitle>
            <CardDescription>
              Select {mergeMode} to merge. Selected items will be combined into one entity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedItems.length} selected</Badge>
              <Button onClick={handleMergeItems} disabled={selectedItems.length < 2} size="sm">
                Merge Selected
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setMergeMode(null)
                  setSelectedItems([])
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articleStats.length}</div>
            <p className="text-xs text-muted-foreground">Unique products tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-muted-foreground">Compared to last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={categoryData.reduce((sum, cat) => sum + cat.total_value, 0)} currency="TND" />
            </div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Articles by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Trends Overview</CardTitle>
            <CardDescription>Articles with significant price changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {articleStats.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    mergeMode === "articles" && selectedItems.includes(article.id)
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    if (mergeMode === "articles") {
                      setSelectedItems((prev) =>
                        prev.includes(article.id) ? prev.filter((id) => id !== article.id) : [...prev, article.id],
                      )
                    }
                  }}
                >
                  <div>
                    <p className="font-medium">{article.name}</p>
                    <p className="text-sm text-muted-foreground">{article.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyDisplay amount={article.avg_price} currency="TND" />
                    {article.price_trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : article.price_trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Article Details */}
      <Card>
        <CardHeader>
          <CardTitle>Article Price Analysis</CardTitle>
          <CardDescription>
            Select an article to view detailed price variations and supplier comparisons
          </CardDescription>
          <Select value={selectedArticle} onValueChange={setSelectedArticle}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an article" />
            </SelectTrigger>
            <SelectContent>
              {articleStats.map((article) => (
                <SelectItem key={article.id} value={article.id}>
                  {article.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        {selectedArticleData && (
          <CardContent className="space-y-6">
            {/* Price History Chart */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Price History</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={selectedArticleData.price_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Supplier Comparison */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Supplier Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedArticleData.suppliers.map((supplier, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="font-medium">{supplier.supplier_name}</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg Price:</span>
                          <CurrencyDisplay amount={supplier.avg_price} currency="TND" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Quantity:</span>
                          <span>{supplier.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Purchase:</span>
                          <span className="text-sm">{new Date(supplier.last_purchase).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Supplier Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Supplier Price Comparisons</CardTitle>
          <CardDescription>Compare prices for the same articles across different suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {supplierComparisons.slice(0, 3).map((comparison, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-3">{comparison.article_name}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparison.suppliers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="supplier_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="price" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
