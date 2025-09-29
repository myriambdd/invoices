"use client"

import { useEffect, useState } from "react"
import { CurrencyConverter } from "@/lib/currency"

interface CurrencyDisplayProps {
  amount: number
  currency: string
  className?: string
  showOriginalOnly?: boolean
}

export function CurrencyDisplay({ amount, currency, className = "", showOriginalOnly = false }: CurrencyDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeConverter = async () => {
      await CurrencyConverter.initialize()
      
      if (!showOriginalOnly) {
        const converted = CurrencyConverter.convertToTND(amount, currency)
        setConvertedAmount(converted)
      }
      
      setIsLoading(false)
    }

    initializeConverter()
  }, [amount, currency, showOriginalOnly])

  if (isLoading) {
    return <span className={`animate-pulse bg-muted rounded px-2 py-1 ${className}`}>Loading...</span>
  }

  // If showing original only or currency is already TND
  if (showOriginalOnly || currency === "TND") {
    return (
      <div className={className}>
        <span className="font-semibold">
          {CurrencyConverter.formatAmount(amount, currency)}
        </span>
      </div>
    )
  }

  // Show TND conversion with original as subtitle
  return (
    <div className={className}>
      <div className="font-semibold">
        {CurrencyConverter.formatAmountTND(convertedAmount)}
      </div>
      {currency !== "TND" && (
        <div className="text-xs text-muted-foreground">
          {CurrencyConverter.formatAmount(amount, currency)}
        </div>
      )}
    </div>
  )
}