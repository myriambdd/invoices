"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Plus, CreditCard as Edit, Trash2, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react"
import { CurrencyDisplay } from "@/components/currency-display"

interface Article {
  id: string
  name: string
  description: string
  category: string
  unit: string
  avg_price: number
  total_quantity: number
  price_trend: "up" | "down" | "stable"
  suppliers_count: number
  last_purchase: string
  created_at: string
}

export function ArticlesContent() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  useEffect(() => {
    filterAndSortArticles()
  }, [articles, searchTerm, categoryFilter, sortBy])

  const fetchArticles = async () => {
    try {
      // Mock data - in a real app, this would come from your API
      const mockArticles: Article[] = [
        {
          id: "1",
          name: "Office Paper A4",
          description: "High-quality white paper for office use",
          category: "Office Supplies",
          unit: "pack",
          avg_price: 12.5,
          total_quantity: 500,
          price_trend: "up",
          suppliers_count: 3,
          last_purchase: "2024-01-15",
          created_at: "2023-06-01",
        },
        {
          id: "2",
          name: "Laptop Dell XPS",
          description: "Professional laptop for business use",
          category: "Technology",
          unit: "unit",
          avg_price: 1250.0,
          total_quantity: 25,
          price_trend: "down",
          suppliers_count: 2,
          last_purchase: "2024-01-10",
          created_at: "2023-08-15",
        },
        {
          id: "3",
          name: "Coffee Beans Premium",
          description: "Premium arabica coffee beans",
          category: "Food & Beverage",
          unit: "kg",
          avg_price: 25.0,
          total_quantity: 100,
          price_trend: "stable",
          suppliers_count: 2,
          last_purchase: "2024-01-12",
          created_at: "2023-09-20",
        },
        {
          id: "4",
          name: "Printer Ink Cartridge",
          description: "Black ink cartridge for HP printers",
          category: "Office Supplies",
          unit: "unit",
          avg_price: 45.0,
          total_quantity: 50,
          price_trend: "up",
          suppliers_count: 4,
          last_purchase: "2024-01-08",
          created_at: "2023-07-10",
        },
        {
          id: "5",
          name: "Cleaning Supplies Kit",
          description: "Complete cleaning supplies for office maintenance",
          category: "Maintenance",
          unit: "kit",
          avg_price: 35.0,
          total_quantity: 20,
          price_trend: "stable",
          suppliers_count: 2,
          last_purchase: "2024-01-05",
          created_at: "2023-10-01",
        },
      ]

      setArticles(mockArticles)
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortArticles = () => {
    const filtered = articles.filter((article) => {
      const matchesSearch =
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price":
          return b.avg_price - a.avg_price
        case "quantity":
          return b.total_quantity - a.total_quantity
        case "last_purchase":
          return new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime()
        default:
          return 0
      }
    })

    setFilteredArticles(filtered)
  }

  const categories = Array.from(new Set(articles.map((article) => article.category)))

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-600" />
    }
  }

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
          <Package className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Articles</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay
                amount={articles.reduce((sum, a) => sum + a.avg_price, 0) / articles.length}
                currency="TND"
              />
            </div>
            <p className="text-xs text-muted-foreground">Across all articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.reduce((sum, a) => sum + a.total_quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price (High to Low)</SelectItem>
                <SelectItem value="quantity">Quantity (High to Low)</SelectItem>
                <SelectItem value="last_purchase">Last Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{article.name}</CardTitle>
                  <CardDescription className="mt-1">{article.description}</CardDescription>
                </div>
                <div className="flex items-center gap-1">{getTrendIcon(article.price_trend)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{article.category}</Badge>
                <span className="text-sm text-muted-foreground">{article.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Avg Price</p>
                  <p className="font-semibold">
                    <CurrencyDisplay amount={article.avg_price} currency="TND" />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{article.total_quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Suppliers</p>
                  <p className="font-semibold">{article.suppliers_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Purchase</p>
                  <p className="font-semibold">{new Date(article.last_purchase).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No articles found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}