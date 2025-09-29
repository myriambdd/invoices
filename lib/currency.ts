interface ExchangeRate {
  id: string
  from_currency_code: string
  to_currency_code: string
  rate: number
  updated_at: string
}

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  is_base: boolean
}

export class CurrencyConverter {
  private static exchangeRates: ExchangeRate[] = []
  private static currencies: Currency[] = []
  private static baseCurrency: Currency | null = null
  private static initialized = false

  static async initialize() {
    if (this.initialized) return

    try {
      const [ratesRes, currenciesRes] = await Promise.all([
        fetch("/api/exchange-rates"),
        fetch("/api/currencies")
      ])

      if (ratesRes.ok && currenciesRes.ok) {
        this.exchangeRates = await ratesRes.json()
        this.currencies = await currenciesRes.json()
        this.baseCurrency = this.currencies.find((c) => c.is_base) || null
        this.initialized = true
      }
    } catch (error) {
      console.error("Failed to initialize currency converter:", error)
    }
  }

  static convertToTND(amount: number, fromCurrency: string): number {
    if (!this.baseCurrency || fromCurrency === "TND") {
      return amount
    }

    const rate = this.exchangeRates.find(
      (r) => r.from_currency_code === fromCurrency && r.to_currency_code === "TND"
    )

    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency} to TND`)
      return amount
    }

    return amount * rate.rate
  }

  static formatAmount(amount: number, currency: string): string {
    const currencyInfo = this.currencies.find((c) => c.code === currency)
    const symbol = currencyInfo?.symbol || currency

    return new Intl.NumberFormat("fr-TN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " " + symbol
  }

  static formatAmountTND(amount: number): string {
    return new Intl.NumberFormat("fr-TN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " TND"
  }

  static getBaseCurrency(): Currency | null {
    return this.baseCurrency
  }

  static getCurrencies(): Currency[] {
    return this.currencies
  }

  static getExchangeRates(): ExchangeRate[] {
    return this.exchangeRates
  }

  static getCurrencySymbol(code: string): string {
    const currency = this.currencies.find((c) => c.code === code)
    return currency?.symbol || code
  }
}