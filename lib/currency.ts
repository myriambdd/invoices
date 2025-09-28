interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
}

interface Currency {
  code: string
  symbol: string
  is_base: boolean
}

export class CurrencyConverter {
  private static exchangeRates: ExchangeRate[] = []
  private static currencies: Currency[] = []
  private static baseCurrency: Currency | null = null

  static async initialize() {
    try {
      const [ratesRes, currenciesRes] = await Promise.all([fetch("/api/exchange-rates"), fetch("/api/currencies")])

      this.exchangeRates = await ratesRes.json()
      this.currencies = await currenciesRes.json()
      this.baseCurrency = this.currencies.find((c) => c.is_base) || null
    } catch (error) {
      console.error("Failed to initialize currency converter:", error)
    }
  }

  static convertToBase(amount: number, fromCurrency: string): number {
    if (!this.baseCurrency || fromCurrency === this.baseCurrency.code) {
      return amount
    }

    const rate = this.exchangeRates.find(
      (r) => r.from_currency === fromCurrency && r.to_currency === this.baseCurrency!.code,
    )

    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency} to ${this.baseCurrency.code}`)
      return amount
    }

    return amount * rate.rate
  }

  static convertFromBase(amount: number, toCurrency: string): number {
    if (!this.baseCurrency || toCurrency === this.baseCurrency.code) {
      return amount
    }

    const rate = this.exchangeRates.find(
      (r) => r.from_currency === this.baseCurrency!.code && r.to_currency === toCurrency,
    )

    if (!rate) {
      console.warn(`No exchange rate found for ${this.baseCurrency.code} to ${toCurrency}`)
      return amount
    }

    return amount * rate.rate
  }

  static convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount
    }

    // Convert to base currency first, then to target currency
    const baseAmount = this.convertToBase(amount, fromCurrency)
    return this.convertFromBase(baseAmount, toCurrency)
  }

  static formatAmount(amount: number, currency: string): string {
    const currencyInfo = this.currencies.find((c) => c.code === currency)
    const symbol = currencyInfo?.symbol || currency

    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: currency,
      currencyDisplay: "symbol",
    })
      .format(amount)
      .replace(currency, symbol)
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
}
