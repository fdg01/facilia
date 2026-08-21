// modules/quoter/presentation/hooks/useParameters.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Parameter } from '../../domain/entities'

interface UseParametersResult {
  parameter: Parameter | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useParameters(): UseParametersResult {
  const [parameter, setParameter] = useState<Parameter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/parameters/active')
        const json = await res.json()
        if (!cancelled) {
          if (json.error) {
            setError(json.error.message)
          } else {
            setParameter(json.data)
            setError(null)
          }
        }
      } catch {
        if (!cancelled) setError('Error al cargar parámetros')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  return { parameter, loading, error, reload }
}
