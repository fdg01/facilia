// modules/quoter/presentation/hooks/useLeads.ts
'use client'

import { useState, useCallback } from 'react'
import type { Lead } from '../../domain/entities'

interface UseLeadsResult {
  leads: Lead[]
  loading: boolean
  error: string | null
  fetchLeads: (filters?: { status?: string; line?: string }) => Promise<void>
}

export function useLeads(): UseLeadsResult {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async (filters?: { status?: string; line?: string }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.line) params.set('line', filters.line)
      const url = `/api/leads${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
      } else {
        setLeads(json.data ?? [])
        setError(null)
      }
    } catch {
      setError('Error al cargar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  return { leads, loading, error, fetchLeads }
}
