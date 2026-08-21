'use client'

import { apiUrl } from "@/lib/api-url"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { DagNode, DagEdge, DagOption, DagSelection, QuoteResult, ServiceLine } from '@modules/quoter/domain/entities'

interface DagData {
  nodes: DagNode[]
  edges: DagEdge[]
  options: DagOption[]
}

interface GiftData {
  id: string
  description: string
  active: boolean
}

type GiftDataOrNull = GiftData | null

const nodeTypeLabels: Record<string, string> = {
  root: 'Línea',
  category: 'Categoría',
  option: 'Opción',
  input: 'Entrada',
  consumable: 'Insumo',
  extra: 'Extra',
  closing: 'Cierre',
}

interface QuoterPortalProps {
  userName: string
  userEmail: string
}

export function QuoterPortal({ userName, userEmail }: QuoterPortalProps) {
  const router = useRouter()
  const [dag, setDag] = useState<DagData | null>(null)
  const [gift, setGift] = useState<GiftDataOrNull>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<DagSelection[]>([])
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [contact, setContact] = useState({
    name: userName,
    email: userEmail,
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [dagRes, giftRes] = await Promise.all([
          fetch(apiUrl('/api/dag')),
          fetch(apiUrl('/api/welcome-gift')),
        ])
        const dagJson = await dagRes.json()
        const giftJson = await giftRes.json()
        if (!cancelled) {
          if (dagJson.error) throw new Error(dagJson.error.message)
          setDag(dagJson.data)
          setGift(giftJson.data)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Calculate reachable nodes from root + selected
  const reachableNodeIds = useMemo(() => {
    if (!dag) return new Set<string>()
    const rootNodes = dag.nodes.filter((n) => n.type === 'root' && n.active)
    const reachable = new Set<string>(rootNodes.map((n) => n.id))
    const queue = [...rootNodes.map((n) => n.id)]
    while (queue.length > 0) {
      const currentId = queue.shift()!
      const childEdges = dag.edges.filter(
        (e) => e.sourceId === currentId && e.active,
      )
      for (const edge of childEdges) {
        if (!reachable.has(edge.targetId)) {
          reachable.add(edge.targetId)
          queue.push(edge.targetId)
        }
      }
    }
    return reachable
  }, [dag])

  const visibleNodes = useMemo(() => {
    if (!dag) return []
    return dag.nodes.filter(
      (n) => n.active && reachableNodeIds.has(n.id),
    )
  }, [dag, reachableNodeIds])

  // Quote calculation
  useEffect(() => {
    let cancelled = false
    async function fetchQuote() {
      if (selections.length === 0) {
        if (!cancelled) setQuote(null)
        return
      }
      try {
        const res = await fetch(apiUrl('/api/quote'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selections }),
        })
        const json = await res.json()
        if (!cancelled) {
          if (json.error) {
            setError(json.error.message)
          } else {
            setQuote(json.data)
            setError(null)
          }
        }
      } catch {
        if (!cancelled) setError('Error al calcular precio')
      }
    }
    fetchQuote()
    return () => { cancelled = true }
  }, [selections])

  const mainLine = useMemo<ServiceLine | null>(() => {
    if (!dag) return null
    for (const sel of selections) {
      const node = dag.nodes.find((n) => n.id === sel.nodeId)
      if (node?.type === 'root' && node.line) return node.line
    }
    return null
  }, [dag, selections])

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.nodeId === nodeId)
      if (existing) {
        return prev.filter((s) => s.nodeId !== nodeId)
      }
      return [...prev, { nodeId, optionId: null, value: null }]
    })
  }, [])

  const handleInputValue = useCallback((nodeId: string, value: Record<string, unknown>) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.nodeId === nodeId)
      if (existing) {
        return prev.map((s) => s.nodeId === nodeId ? { ...s, value } : s)
      }
      return [...prev, { nodeId, optionId: null, value }]
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!mainLine || !contact.name || !contact.email || !contact.phone) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/portal/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          selections,
          mainLine,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
      } else {
        router.push(`/portal/leads/${json.data.id}`)
      }
    } catch {
      setError('Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }, [mainLine, contact, selections, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Cargando cotizador...</p>
      </div>
    )
  }

  if (error && !dag) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!dag) return null

  return (
    <div className="space-y-6 pb-32 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva cotización</h1>
        <p className="text-gray-600 text-sm mt-1">Seleccioná los servicios que necesitás y mirá el precio en vivo.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Render nodes */}
      <div className="space-y-4">
        {visibleNodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            dag={dag}
            selections={selections}
            onSelect={handleSelectNode}
            onInput={handleInputValue}
          />
        ))}
      </div>

      {/* Contact form */}
      {selections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-lg">Datos de contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating summary */}
      {quote && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg p-4 md:sticky md:bottom-4 md:rounded-xl md:border md:max-w-md md:mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Costo mensual</p>
              <p className="text-xl font-bold text-orange-600">${quote.totalMonthly.toFixed(2)}</p>
            </div>
            {quote.totalPerVisit > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Por visita</p>
                <p className="text-lg font-semibold">${quote.totalPerVisit.toFixed(2)}</p>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting || !contact.name || !contact.email || !contact.phone}
              className="rounded-lg bg-orange-600 px-6 py-3 text-white font-medium hover:bg-orange-700 transition disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {gift?.active && gift.description && (
        <div className="p-4 bg-amber-50 rounded-lg text-sm">
          <span className="font-semibold text-amber-800">Regalo de bienvenida: </span>
          <span className="text-amber-700">{gift.description} (sin costo)</span>
        </div>
      )}
    </div>
  )
}

interface NodeCardProps {
  node: DagNode
  dag: DagData
  selections: DagSelection[]
  onSelect: (nodeId: string) => void
  onInput: (nodeId: string, value: Record<string, unknown>) => void
}

function NodeCard({ node, selections, onSelect, onInput }: NodeCardProps) {
  const selected = selections.some((s) => s.nodeId === node.id)
  const sel = selections.find((s) => s.nodeId === node.id)

  if (node.type === 'root') {
    return (
      <button
        onClick={() => onSelect(node.id)}
        className={`w-full text-left p-5 rounded-xl border-2 transition ${
          selected
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{nodeTypeLabels[node.type]}</p>
            <p className="font-semibold text-lg">{node.label}</p>
          </div>
          {selected && (
            <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white">✓</span>
          )}
        </div>
      </button>
    )
  }

  if (node.type === 'input') {
    const currentValue = sel?.value as Record<string, unknown> | null
    return (
      <div className="p-5 rounded-xl border border-gray-200 bg-white">
        <p className="text-xs text-gray-500">{nodeTypeLabels[node.type]}</p>
        <p className="font-semibold mb-3">{node.label}</p>
        <input
          type="number"
          placeholder="Ingrese valor"
          value={currentValue?.value as string ?? ''}
          onChange={(e) => onInput(node.id, { value: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
    )
  }

  // option, category, consumable, extra, closing
  return (
    <button
      onClick={() => onSelect(node.id)}
      className={`w-full text-left p-4 rounded-xl border transition ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{nodeTypeLabels[node.type]}</p>
          <p className="font-medium">{node.label}</p>
        </div>
        {selected && (
          <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">✓</span>
        )}
      </div>
    </button>
  )
}

