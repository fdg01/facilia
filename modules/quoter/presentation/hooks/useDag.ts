// modules/quoter/presentation/hooks/useDag.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DagNode, DagEdge, DagOption } from '../../domain/entities'

interface DagData {
  nodes: DagNode[]
  edges: DagEdge[]
  options: DagOption[]
}

interface UseDagResult {
  dag: DagData | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useDag(): UseDagResult {
  const [dag, setDag] = useState<DagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/dag')
        const json = await res.json()
        if (!cancelled) {
          if (json.error) {
            setError(json.error.message)
          } else {
            setDag(json.data)
            setError(null)
          }
        }
      } catch {
        if (!cancelled) setError('Error al cargar el DAG')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  return { dag, loading, error, reload }
}
