// modules/quoter/presentation/hooks/useQuote.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DagSelection, QuoteResult } from '../../domain/entities'

interface UseQuoteResult {
  quote: QuoteResult | null
  loading: boolean
  error: string | null
  calculate: (selections: DagSelection[]) => Promise<void>
}

export function useQuote(): UseQuoteResult {
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (selections: DagSelection[]) => {
    if (selections.length === 0) {
      setQuote(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
      } else {
        setQuote(json.data)
        setError(null)
      }
    } catch {
      setError('Error al calcular precio')
    } finally {
      setLoading(false)
    }
  }, [])

  return { quote, loading, error, calculate }
}
