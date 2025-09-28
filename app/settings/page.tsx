"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings } from "lucide-react"
import { useState, useEffect } from "react"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  is_base: boolean
}

interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  updated_at: string
}

export default function SettingsPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [newRate, setNewRate] = useState({ from: "", to: "", rate: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [currenciesRes, ratesRes] = await Promise.all([fetch("/api/currencies"), fetch("/api/exchange-rates")])

      const currenciesData = await currenciesRes.json()
      const ratesData = await ratesRes.json()

      setCurrencies(currenciesData)
      setExchangeRates(ratesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRate = async () => {
    if (!newRate.from || !newRate.to || !newRate.rate) return

    try {
      const response = await fetch("/api/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_currency: newRate.from,
          to_currency: newRate.to,
          rate: Number.parseFloat(newRate.rate),
        }),
      })

      if (response.ok) {
        setNewRate({ from: "", to: "", rate: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Error adding exchange rate:", error)
    }
  }

  const handleDeleteRate = async (id: string) => {
    try {
      const response = await fetch(`/api/exchange-rates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting exchange rate:", error)
    }
  }

  const baseCurrency = currencies.find((c) => c.is_base)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Base Currency</CardTitle>
          <CardDescription>All amounts will be converted to this currency for reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {baseCurrency?.code} - {baseCurrency?.name}
            </Badge>
            <span className="text-muted-foreground">({baseCurrency?.symbol})</span>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
          <CardDescription>Manage conversion rates for different currencies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Rate */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <Label htmlFor="from-currency">From Currency</Label>
              <Select value={newRate.from} onValueChange={(value) => setNewRate((prev) => ({ ...prev, from: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies
                    .filter((c) => !c.is_base)
                    .map((currency) => (
                      <SelectItem key={currency.id} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to-currency">To Currency</Label>
              <Select value={newRate.to} onValueChange={(value) => setNewRate((prev) => ({ ...prev, to: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Exchange Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={newRate.rate}
                onChange={(e) => setNewRate((prev) => ({ ...prev, rate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddRate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </div>
          </div>

          {/* Existing Rates */}
          <div className="space-y-2">
            {exchangeRates.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{rate.from_currency}</Badge>
                  <span>→</span>
                  <Badge variant="outline">{rate.to_currency}</Badge>
                  <span className="font-mono text-lg">{rate.rate.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Updated: {new Date(rate.updated_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRate(rate.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {exchangeRates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No exchange rates configured yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
