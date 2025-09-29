"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Settings, RefreshCw, Save, Mail, Building } from "lucide-react"
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
  const [newRate, setNewRate] = useState({ from: "", rate: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [currenciesRes, ratesRes, settingsRes] = await Promise.all([
        fetch("/api/currencies"),
        fetch("/api/exchange-rates"),
        fetch("/api/settings")
      ])

      if (currenciesRes.ok) {
        const currenciesData = await currenciesRes.json()
        setCurrencies(currenciesData)
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
      const baseCurrency = currencies.find(c => c.code === settings.base_currency)
      if (baseCurrency) {
        await fetch("/api/settings/base-currency", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency_id: baseCurrency.id }),
        })
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
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
        throw new Error("Failed to add exchange rate")
      }
    } catch (error) {
      console.error("Error adding exchange rate:", error)
      toast({
        title: "Error",
        description: "Failed to add exchange rate",
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

  const baseCurrency = currencies.find((c) => c.is_base) || currencies.find((c) => c.code === settings.base_currency)
  const nonBaseCurrencies = currencies.filter((c) => !c.is_base && c.code !== settings.base_currency)

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
              <Label htmlFor="company-email">Company Email</Label>
              <Input
                id="company-email"
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="company@example.com"
              />
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

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Base Currency</CardTitle>
          <CardDescription>All amounts will be converted to this currency for display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="base-currency">Select Base Currency</Label>
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
          </div>
          
          {baseCurrency && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-lg px-4 py-2">
                {baseCurrency.code} - {baseCurrency.name}
              </Badge>
              <span className="text-muted-foreground">({baseCurrency.symbol})</span>
            </div>
          )}
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

          {/* Existing Rates */}
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
                  <Badge variant={currency.code === settings.base_currency ? "default" : "outline"}>
                    {currency.code}
                  </Badge>
                  <div>
                    <p className="font-medium">{currency.name}</p>
                    <p className="text-sm text-muted-foreground">{currency.symbol}</p>
                  </div>
                </div>
                {currency.code === settings.base_currency && (
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