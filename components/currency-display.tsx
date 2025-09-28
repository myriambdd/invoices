"use client"

import { useEffect, useState } from "react"
import { CurrencyConverter } from "@/lib/currency"
import { Badge } from "@/components/ui/badge"

interface CurrencyDisplayProps {
  amount: number
  currency: string
  showOriginal?: boolean
  className?: string
}

export function CurrencyDisplay({ amount, currency, showOriginal = false, className = "" }: CurrencyDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount)
  const [baseCurrency, setBaseCurrency] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeConverter = async () => {
      await CurrencyConverter.initialize()
      const base = CurrencyConverter.getBaseCurrency()

      if (base) {
        setBaseCurrency(base.code)
        const converted = CurrencyConverter.convertToBase(amount, currency)
        setConvertedAmount(converted)
      }

      setIsLoading(false)
    }

    initializeConverter()
  }, [amount, currency])

  if (isLoading) {
    return <span className={`animate-pulse bg-muted rounded ${className}`}>Loading...</span>
  }

  const originalFormatted = CurrencyConverter.formatAmount(amount, currency)
  const convertedFormatted = CurrencyConverter.formatAmount(convertedAmount, baseCurrency)

  if (currency === baseCurrency || !showOriginal) {
    return <span className={className}>{convertedFormatted}</span>
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>{convertedFormatted}</span>
      <Badge variant="outline" className="text-xs">
        {originalFormatted}
      </Badge>
    </div>
  )
}
