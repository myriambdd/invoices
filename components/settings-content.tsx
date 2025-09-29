"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Settings, RefreshCw, Save, Mail, Building, DollarSign, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

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

interface AppSettings {
  base_currency: string
  company_name: string
  company_email: string
  notification_email: string
  reminder_days_before: string
  reminder_days_after: string
}

export function SettingsContent() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    base_currency: "TND",
    company_name: "",
    company_email: "",
    notification_email: "",
    reminder_days_before: "7,3,1",
    reminder_days_after: "1,7,14,30",
  })
  const [newCurrency, setNewCurrency] = useState({ code: "", name: "", symbol: "" })
  const [newRate, setNewRate] = useState({ from: "", rate: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingCurrency, setAddingCurrency] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [currenciesRes, ratesRes, settingsRes] = await Promise.all([
        fetch("/api/currencies"),
        fetch("/api/exchange-rates"),
        fetch("/api/settings").catch(() => ({ ok: false }))
      ])

      if (currenciesRes.ok) {
        const currenciesData = await currenciesRes.json()
        setCurrencies(currenciesData)
        
        // Set base currency from database
        const baseCurrency = currenciesData.find((c: Currency) => c.is_base)
        if (baseCurrency) {
          setSettings(prev => ({ ...prev, base_currency: baseCurrency.code }))
        }
      }

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json()
        setExchangeRates(ratesData)
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(prev => ({ ...prev, ...settingsData }))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCurrency = async () => {
    if (!newCurrency.code || !newCurrency.name) {
      toast({
        title: "Error",
        description: "Currency code and name are required",
        variant: "destructive",
      })
      return
    }

    setAddingCurrency(true)
    try {
      const response = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCurrency.code.toUpperCase(),
          name: newCurrency.name,
          symbol: newCurrency.symbol || newCurrency.code.toUpperCase(),
        }),
      })

      if (response.ok) {
        setNewCurrency({ code: "", name: "", symbol: "" })
        fetchData()
        toast({
          title: "Success",
          description: "Currency added successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add currency")
      }
    } catch (error) {
      console.error("Error adding currency:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add currency",
        variant: "destructive",
      })
    } finally {
      setAddingCurrency(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Save each setting
      const settingsToSave = [
        { key: "company_name", value: settings.company_name, description: "Company name for invoices" },
        { key: "company_email", value: settings.company_email, description: "Company email for sending notifications" },
        { key: "notification_email", value: settings.notification_email, description: "Email to receive notifications" },
        { key: "reminder_days_before", value: settings.reminder_days_before, description: "Days before due date to send reminders" },
        { key: "reminder_days_after", value: settings.reminder_days_after, description: "Days after due date to send reminders" },
      ]

      for (const setting of settingsToSave) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setting),
        })
      }

      // Update base currency if changed
      const currentBaseCurrency = currencies.find(c => c.is_base)
      if (currentBaseCurrency?.code !== settings.base_currency) {
        const newBaseCurrency = currencies.find(c => c.code === settings.base_currency)
        if (newBaseCurrency) {
          await fetch("/api/settings/base-currency", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currency_id: newBaseCurrency.id }),
          })
        }
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
      
      // Refresh data to show updated base currency
      fetchData()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddRate = async () => {
    if (!newRate.from || !newRate.rate) {
      toast({
        title: "Error",
        description: "Please select a currency and enter a rate",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_currency: newRate.from,
          to_currency: settings.base_currency,
          rate: parseFloat(newRate.rate),
        }),
      })

      if (response.ok) {
        setNewRate({ from: "", rate: "" })
        fetchData()
        toast({
          title: "Success",
          description: "Exchange rate added successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add exchange rate")
      }
    } catch (error) {
      console.error("Error adding exchange rate:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add exchange rate",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRate = async (id: string) => {
    try {
      const response = await fetch(`/api/exchange-rates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
        toast({
          title: "Success",
          description: "Exchange rate deleted successfully",
        })
      } else {
        throw new Error("Failed to delete exchange rate")
      }
    } catch (error) {
      console.error("Error deleting exchange rate:", error)
      toast({
        title: "Error",
        description: "Failed to delete exchange rate",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRate = async (id: string, newRateValue: string) => {
    try {
      const response = await fetch(`/api/exchange-rates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: parseFloat(newRateValue) }),
      })

      if (response.ok) {
        fetchData()
        toast({
          title: "Success",
          description: "Exchange rate updated successfully",
        })
      } else {
        throw new Error("Failed to update exchange rate")
      }
    } catch (error) {
      console.error("Error updating exchange rate:", error)
      toast({
        title: "Error",
        description: "Failed to update exchange rate",
        variant: "destructive",
      })
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
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Basic company details for invoices and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <Label htmlFor="company-email">Company Email (Sender)</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="company@example.com"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Email address used to send notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Configure email settings for payment reminders and notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notification-email">Notification Recipient Email</Label>
            <Input
              id="notification-email"
              type="email"
              value={settings.notification_email}
              onChange={(e) => setSettings(prev => ({ ...prev, notification_email: e.target.value }))}
              placeholder="admin@company.com"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email address that will receive payment reminders and notifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reminder-before">Reminder Days (Before Due)</Label>
              <Input
                id="reminder-before"
                value={settings.reminder_days_before}
                onChange={(e) => setSettings(prev => ({ ...prev, reminder_days_before: e.target.value }))}
                placeholder="7,3,1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Comma-separated days before due date (e.g., 7,3,1)
              </p>
            </div>
            <div>
              <Label htmlFor="reminder-after">Reminder Days (After Due)</Label>
              <Input
                id="reminder-after"
                value={settings.reminder_days_after}
                onChange={(e) => setSettings(prev => ({ ...prev, reminder_days_after: e.target.value }))}
                placeholder="1,7,14,30"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Comma-separated days after due date (e.g., 1,7,14,30)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Management
          </CardTitle>
          <CardDescription>Manage currencies and set the base currency for your system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Currency Selection */}
          <div>
            <Label htmlFor="base-currency">Base Currency</Label>
            <Select 
              value={settings.base_currency} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, base_currency: value }))}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              All amounts will be converted to this currency for display
            </p>
            
            {baseCurrency && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="text-lg px-4 py-2">
                  {baseCurrency.code} - {baseCurrency.name}
                </Badge>
                <span className="text-muted-foreground">({baseCurrency.symbol})</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Add New Currency */}
          <div>
            <h4 className="font-semibold mb-3">Add New Currency</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
              <div>
                <Label htmlFor="currency-code">Currency Code</Label>
                <Input
                  id="currency-code"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="EUR"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="currency-name">Currency Name</Label>
                <Input
                  id="currency-name"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Euro"
                />
              </div>
              <div>
                <Label htmlFor="currency-symbol">Symbol</Label>
                <Input
                  id="currency-symbol"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="€"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddCurrency} 
                  className="w-full" 
                  disabled={!newCurrency.code || !newCurrency.name || addingCurrency}
                >
                  {addingCurrency ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Currency
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Available Currencies */}
          <div>
            <h4 className="font-semibold mb-3">Available Currencies</h4>
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
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates to {settings.base_currency}</CardTitle>
          <CardDescription>Set conversion rates from other currencies to {settings.base_currency}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Rate */}
          <div>
            <h4 className="font-semibold mb-3">Add Exchange Rate</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/20">
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
                <Label htmlFor="rate">Exchange Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={newRate.rate}
                  onChange={(e) => setNewRate((prev) => ({ ...prev, rate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1 {newRate.from} = ? {settings.base_currency}
                </p>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddRate} className="w-full" disabled={!newRate.from || !newRate.rate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Rates */}
          <div>
            <h4 className="font-semibold mb-3">Current Exchange Rates</h4>
            <div className="space-y-2">
              {exchangeRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">
                      1 {rate.from_currency_code}
                    </Badge>
                    <span>=</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        value={rate.rate}
                        onChange={(e) => handleUpdateRate(rate.id, e.target.value)}
                        className="w-24 h-8 text-center font-mono"
                      />
                      <Badge variant="outline" className="font-mono">
                        {settings.base_currency}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({rate.from_currency_symbol} → {baseCurrency?.symbol})
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}