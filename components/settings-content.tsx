"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings, RefreshCw } from "lucide-react"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  is_base: boolean
}

interface ExchangeRate {
  id: string
  from_currency_code: string
  to_currency_code: string
  from_currency_symbol: string
  to_currency_symbol: string
  rate: number
  updated_at: string
}

export function SettingsContent() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [newRate, setNewRate] = useState({ from: "", to: "TND", rate: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [currenciesRes, ratesRes] = await Promise.all([
        fetch("/api/currencies"),
        fetch("/api/exchange-rates")
      ])

      if (currenciesRes.ok && ratesRes.ok) {
        const currenciesData = await currenciesRes.json()
        const ratesData = await ratesRes.json()

        setCurrencies(currenciesData)
        setExchangeRates(ratesData)
      }
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
          rate: parseFloat(newRate.rate),
        }),
      })

      if (response.ok) {
        setNewRate({ from: "", to: "TND", rate: "" })
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
  const nonBaseCurrencies = currencies.filter((c) => !c.is_base)

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
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Rates
        </Button>
      </div>

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Base Currency</CardTitle>
          <CardDescription>All amounts will be converted to this currency for display</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-2">
              {baseCurrency?.code} - {baseCurrency?.name}
            </Badge>
            <span className="text-muted-foreground">({baseCurrency?.symbol})</span>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates to TND</CardTitle>
          <CardDescription>Set conversion rates from other currencies to Tunisian Dinar</CardDescription>
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
                  {nonBaseCurrencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to-currency">To Currency</Label>
              <Select value={newRate.to} onValueChange={(value) => setNewRate((prev) => ({ ...prev, to: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND - Tunisian Dinar (د.ت)</SelectItem>
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
              <Button onClick={handleAddRate} className="w-full" disabled={!newRate.from || !newRate.rate}>
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
                  <Badge variant="outline" className="font-mono">
                    1 {rate.from_currency_code}
                  </Badge>
                  <span>=</span>
                  <Badge variant="outline" className="font-mono">
                    {rate.rate.toFixed(4)} TND
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({rate.from_currency_symbol} → د.ت)
                  </span>
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No exchange rates configured yet</p>
              <p className="text-sm mt-1">Add exchange rates to enable currency conversion</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Currencies</CardTitle>
          <CardDescription>Currencies supported by the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((currency) => (
              <div key={currency.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={currency.is_base ? "default" : "outline"}>
                    {currency.code}
                  </Badge>
                  <div>
                    <p className="font-medium">{currency.name}</p>
                    <p className="text-sm text-muted-foreground">{currency.symbol}</p>
                  </div>
                </div>
                {currency.is_base && (
                  <Badge variant="secondary">Base</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}