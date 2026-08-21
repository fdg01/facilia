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

const lineMeta: Record<ServiceLine, { label: string; tagline: string; icon: string; accent: string; ring: string; chip: string }> = {
  clean: {
    label: 'Clean',
    tagline: 'Limpieza profesional',
    icon: '✦',
    accent: 'border-blue-500',
    ring: 'ring-blue-500/30',
    chip: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  care: {
    label: 'Care',
    tagline: 'Mantenimiento preventivo',
    icon: '◈',
    accent: 'border-orange-500',
    ring: 'ring-orange-500/30',
    chip: 'bg-orange-50 text-orange-700 border-orange-100',
  },
  continuity: {
    label: 'Continuity',
    tagline: 'Insumos y continuidad',
    icon: '◉',
    accent: 'border-navy-500',
    ring: 'ring-navy-500/30',
    chip: 'bg-navy-50 text-navy-700 border-navy-100',
  },
}

export function QuoterDag() {
  const router = useRouter()
  const [dag, setDag] = useState<DagData | null>(null)
  const [gift, setGift] = useState<GiftDataOrNull>(null)
  const [selections, setSelections] = useState<DagSelection[]>([])
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'contact'>('select')
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [dagRes, giftRes] = await Promise.all([
          fetch(apiUrl('/api/dag')),
          fetch(apiUrl('/api/welcome-gift')),
        ])
        const dagJson = await dagRes.json()
        const giftJson = await giftRes.json()
        if (dagJson.error) throw new Error(dagJson.error.message)
        setDag(dagJson.data)
        setGift(giftJson.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const rootNodes = useMemo(() => {
    if (!dag) return []
    return dag.nodes.filter((n) => n.type === 'root' && n.active).sort((a, b) => a.order - b.order)
  }, [dag])

  const selectedRoot = useMemo(() => {
    if (!dag) return null
    for (const sel of selections) {
      const node = dag.nodes.find((n) => n.id === sel.nodeId)
      if (node?.type === 'root') return node
    }
    return null
  }, [dag, selections])

  const mainLine = useMemo<ServiceLine | null>(() => selectedRoot?.line ?? null, [selectedRoot])

  const edgesBySource = useMemo(() => {
    const map = new Map<string, DagEdge[]>()
    if (!dag) return map
    for (const edge of dag.edges) {
      if (!edge.active) continue
      const list = map.get(edge.sourceId) ?? []
      list.push(edge)
      map.set(edge.sourceId, list)
    }
    return map
  }, [dag])

  const optionsByNode = useMemo(() => {
    const map = new Map<string, DagOption[]>()
    if (!dag) return map
    for (const opt of dag.options) {
      if (!opt.active) continue
      const list = map.get(opt.nodeId) ?? []
      list.push(opt)
      map.set(opt.nodeId, list)
    }
    return map
  }, [dag])

  // Progressive DAG expansion — BFS from selected root, respecting edge conditions
  const visibleNodes = useMemo(() => {
    if (!dag || !selectedRoot) return []
    const visible = new Set<string>()
    const ordered: DagNode[] = []
    const queue: string[] = [selectedRoot.id]
    visible.add(selectedRoot.id)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const currentNode = dag.nodes.find((n) => n.id === currentId)
      if (!currentNode) continue

      const edges = edgesBySource.get(currentId) ?? []
      for (const edge of edges) {
        if (visible.has(edge.targetId)) continue
        const targetNode = dag.nodes.find((n) => n.id === edge.targetId)
        if (!targetNode || !targetNode.active) continue

        // Check edge condition
        if (edge.condition) {
          const cond = edge.condition as Record<string, unknown>
          const optionCode = cond['option'] as string | undefined
          if (optionCode) {
            const sel = selections.find((s) => s.nodeId === currentId)
            if (!sel || !sel.optionId) continue
            const sourceOptions = optionsByNode.get(currentId) ?? []
            const selectedOpt = sourceOptions.find((o) => o.id === sel.optionId)
            if (!selectedOpt || selectedOpt.code !== optionCode) continue
          }
        }

        // Category nodes reveal children only after an option is selected
        if (currentNode.type === 'category') {
          const sel = selections.find((s) => s.nodeId === currentId)
          if (!sel || !sel.optionId) continue
        } else if (currentNode.type !== 'root') {
          const sel = selections.find((s) => s.nodeId === currentId)
          if (!sel) continue
        }

        visible.add(edge.targetId)
        ordered.push(targetNode)
        queue.push(edge.targetId)
      }
    }

    return ordered
  }, [dag, selectedRoot, edgesBySource, optionsByNode, selections])

  // Selection helpers
  const selectRoot = useCallback((node: DagNode) => {
    setSelections((prev) => prev.some((s) => s.nodeId === node.id) ? [] : [{ nodeId: node.id, optionId: null, value: null }])
    setQuote(null)
  }, [])

  const selectOption = useCallback((node: DagNode, option: DagOption) => {
    setSelections((prev) => {
      const filtered = prev.filter((s) => s.nodeId !== node.id)
      return [...filtered, { nodeId: node.id, optionId: option.id, value: null }]
    })
  }, [])

  const toggleNode = useCallback((node: DagNode) => {
    setSelections((prev) => prev.some((s) => s.nodeId === node.id) ? prev.filter((s) => s.nodeId !== node.id) : [...prev, { nodeId: node.id, optionId: null, value: null }])
  }, [])

  const updateValue = useCallback((nodeId: string, value: Record<string, unknown>) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.nodeId === nodeId)
      if (!existing) return [...prev, { nodeId, optionId: null, value }]
      return prev.map((s) => s.nodeId === nodeId ? { ...s, value } : s)
    })
  }, [])

  // Live quote
  useEffect(() => {
    let cancelled = false
    async function fetchQuote() {
      if (selections.length <= 1) {
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
          if (json.error) setError(json.error.message)
          else { setQuote(json.data); setError(null) }
        }
      } catch {
        if (!cancelled) setError('Error al calcular precio')
      }
    }
    fetchQuote()
    return () => { cancelled = true }
  }, [selections])

  const handleSubmit = useCallback(async () => {
    if (!mainLine || !contact.name || !contact.email || !contact.phone) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contact, selections, mainLine }),
      })
      const json = await res.json()
      if (json.error) setError(json.error.message)
      else router.push(`/quote/confirmed/${json.data.number}`)
    } catch {
      setError('Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }, [mainLine, contact, selections, router])

  // Count completed steps for progress indicator
  const completedCount = useMemo(() => {
    return selections.filter((s) => {
      const node = dag?.nodes.find((n) => n.id === s.nodeId)
      if (!node) return false
      if (node.type === 'root') return true
      if (node.type === 'category') return s.optionId !== null
      return true
    }).length
  }, [selections, dag])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-navy-100 border-t-orange rounded-full animate-spin" />
        <p className="text-navy/50 text-sm">Cargando cotizador…</p>
      </div>
    )
  }

  if (error && !dag) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">{error}</div>
      )}

      {/* ─── Step 1: Line selection ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <StepBadge n={1} active={!selectedRoot} done={!!selectedRoot} />
          <h2 className="font-display text-lg font-semibold text-navy">Elegí tu línea</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rootNodes.map((node) => {
            const isSelected = selections.some((s) => s.nodeId === node.id)
            const meta = node.line ? lineMeta[node.line] : lineMeta.clean
            return (
              <button
                key={node.id}
                onClick={() => selectRoot(node)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  isSelected
                    ? `${meta.accent} bg-white shadow-soft ring-2 ${meta.ring}`
                    : 'border-navy-100 bg-white/60 hover:border-navy-300 hover:shadow-card'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-2xl transition-transform group-hover:scale-110 ${isSelected ? 'text-orange' : 'text-navy/30'}`}>
                    {meta.icon}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-orange flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-navy text-lg">{meta.label}</h3>
                <p className="text-sm text-navy/50 mt-0.5">{meta.tagline}</p>
                {node.description && (
                  <p className="text-xs text-navy/40 mt-2 leading-relaxed">{node.description}</p>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── Step 2: Progressive DAG ────────────────────────────────────── */}
      {mainLine && visibleNodes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <StepBadge n={2} active={true} done={false} />
            <h2 className="font-display text-lg font-semibold text-navy">Personalizá tu servicio</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${lineMeta[mainLine].chip}`}>
              {lineMeta[mainLine].label}
            </span>
          </div>

          <div className="space-y-3">
            {visibleNodes.map((node, idx) => (
              <div key={node.id} className="animate-[fadeIn_0.3s_ease-out]">
                <ProgressiveNodeCard
                  node={node}
                  options={optionsByNode.get(node.id) ?? []}
                  selection={selections.find((s) => s.nodeId === node.id)}
                  onSelectOption={(opt) => selectOption(node, opt)}
                  onToggle={() => toggleNode(node)}
                  onUpdateValue={(value) => updateValue(node.id, value)}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Floating summary bar ───────────────────────────────────────── */}
      {quote && (
        <div className="fixed bottom-0 left-0 right-0 z-20 md:sticky md:bottom-4 md:z-10">
          <div className="bg-white border-t md:border border-navy-100 md:rounded-2xl shadow-soft">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs uppercase text-navy/40 tracking-wide">Mensual</p>
                  <p className="font-display text-xl font-bold text-navy">${quote.totalMonthly.toFixed(2)}</p>
                </div>
                {quote.totalPerVisit > 0 && (
                  <div className="hidden sm:block">
                    <p className="text-xs uppercase text-navy/40 tracking-wide">Por visita</p>
                    <p className="font-display text-lg font-semibold text-orange">${quote.totalPerVisit.toFixed(2)}</p>
                  </div>
                )}
                {gift && (
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-orange bg-orange-50 rounded-full px-3 py-1.5 border border-orange-100">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.5 5h5L13 10l1.5 5L10 12l-4.5 3L7 10 2.5 7h5L10 2z"/></svg>
                    {gift.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => setStep('contact')}
                disabled={selections.length <= 1}
                className="rounded-xl bg-orange px-6 py-2.5 font-display font-semibold text-white shadow-card hover:bg-orange-700 active:scale-98 disabled:opacity-40 transition-all"
              >
                Solicitar presupuesto →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Contact modal ──────────────────────────────────────────────── */}
      {step === 'contact' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setStep('select')}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-soft max-h-[85vh] overflow-y-auto animate-[fadeUp_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-navy">Confirmá tu presupuesto</h2>
                <button onClick={() => setStep('select')} className="w-8 h-8 rounded-lg flex items-center justify-center text-navy/40 hover:text-navy hover:bg-navy-50 transition">
                  ✕
                </button>
              </div>

              {/* Breakdown */}
              {quote && (
                <div className="rounded-xl border border-navy-100 bg-paper/50 p-4 space-y-1.5">
                  <p className="font-display font-semibold text-sm text-navy mb-2">Resumen</p>
                  {quote.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-navy/70 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange" />
                        {item.label}
                      </span>
                      <span className="font-medium text-navy">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-navy-100 pt-2 mt-2 flex justify-between font-display font-bold">
                    <span className="text-navy">Total mensual</span>
                    <span className="text-navy">${quote.totalMonthly.toFixed(2)}</span>
                  </div>
                  {quote.totalPerVisit > 0 && (
                    <div className="flex justify-between text-sm text-orange">
                      <span>Por visita</span>
                      <span className="font-semibold">${quote.totalPerVisit.toFixed(2)}</span>
                    </div>
                  )}
                  {gift && (
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-navy-100 text-xs text-orange">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.5 5h5L13 10l1.5 5L10 12l-4.5 3L7 10 2.5 7h5L10 2z"/></svg>
                      Regalo: {gift.description}
                    </div>
                  )}
                </div>
              )}

              {/* Contact fields */}
              <div className="space-y-3">
                <Field label="Nombre" value={contact.name} onChange={(v) => setContact((c) => ({ ...c, name: v }))} placeholder="Tu nombre" />
                <Field label="Email" type="email" value={contact.email} onChange={(v) => setContact((c) => ({ ...c, email: v }))} placeholder="tu@email.com" />
                <Field label="Celular" type="tel" value={contact.phone} onChange={(v) => setContact((c) => ({ ...c, phone: v }))} placeholder="09X XXX XXX" />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 rounded-xl border border-navy-100 px-4 py-2.5 text-navy hover:bg-navy-50 transition font-medium"
                >
                  Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !contact.name || !contact.email || !contact.phone}
                  className="flex-1 rounded-xl bg-orange px-4 py-2.5 font-display font-semibold text-white hover:bg-orange-700 active:scale-98 disabled:opacity-40 transition-all"
                >
                  {submitting ? 'Enviando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── UI Primitives ────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  if (done) {
    return (
      <span className="w-7 h-7 rounded-full bg-orange flex items-center justify-center text-white text-sm font-bold shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (active) {
    return <span className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold shrink-0">{n}</span>
  }
  return <span className="w-7 h-7 rounded-full border-2 border-navy-100 flex items-center justify-center text-navy/30 text-sm font-bold shrink-0">{n}</span>
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase text-navy/50 mb-1 tracking-wide font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-navy-100 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
        placeholder={placeholder}
      />
    </div>
  )
}

// ─── Progressive Node Card ────────────────────────────────────────────────

interface ProgressiveNodeCardProps {
  node: DagNode
  options: DagOption[]
  selection: DagSelection | undefined
  onSelectOption: (opt: DagOption) => void
  onToggle: () => void
  onUpdateValue: (value: Record<string, unknown>) => void
  index: number
}

function ProgressiveNodeCard({ node, options, selection, onSelectOption, onToggle, onUpdateValue }: ProgressiveNodeCardProps) {
  const isCategory = node.type === 'category'
  const isInput = node.type === 'input'
  const isOption = node.type === 'option'
  const isConsumable = node.type === 'consumable' || node.type === 'extra'
  const isClosing = node.type === 'closing'
  const isSelected = !!selection
  const m2Value = selection?.value?.['m2'] as number | undefined
  const qtyValue = selection?.value?.['quantity'] as number | undefined

  // Category: mandatory chips
  if (isCategory) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange" />
          <h4 className="font-display font-semibold text-navy">{node.label}</h4>
          <span className="text-[10px] uppercase text-navy/30 ml-auto tracking-wide">Obligatorio</span>
        </div>
        {node.description && <p className="text-sm text-navy/50 mb-3">{node.description}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {options.sort((a, b) => a.order - b.order).map((opt) => {
            const isOptSelected = selection?.optionId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onSelectOption(opt)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95 ${
                  isOptSelected
                    ? 'border-orange bg-orange text-white shadow-card'
                    : 'border-navy-100 bg-white text-navy hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {opt.label}
                {opt.basePrice !== null && opt.basePrice > 0 && (
                  <span className={`ml-1.5 ${isOptSelected ? 'text-white/70' : 'text-navy/40'}`}>
                    ${opt.basePrice}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Option: mandatory selectable card
  if (isOption) {
    return (
      <button
        onClick={onToggle}
        className={`w-full text-left bg-white rounded-2xl border-2 shadow-card p-5 transition-all active:scale-[0.99] ${
          isSelected ? 'border-orange ring-2 ring-orange-500/20' : 'border-navy-100 hover:border-navy-300'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-display font-semibold text-navy">{node.label}</h4>
            {node.description && <p className="text-sm text-navy/50 mt-0.5">{node.description}</p>}
            {node.basePrice !== null && (
              <p className="text-lg font-display font-bold text-orange mt-2">${node.basePrice}</p>
            )}
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
            isSelected ? 'border-orange bg-orange' : 'border-navy-200'
          }`}>
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      </button>
    )
  }

  // Input: mandatory with field
  if (isInput) {
    return (
      <div className={`bg-white rounded-2xl border-2 shadow-card p-5 transition ${
        isSelected || m2Value !== undefined || qtyValue !== undefined ? 'border-blue-500 ring-2 ring-blue-500/15' : 'border-navy-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <h4 className="font-display font-semibold text-navy">{node.label}</h4>
        </div>
        {node.description && <p className="text-sm text-navy/50 mb-3">{node.description}</p>}
        <div className="mt-3">
          {node.priceType === 'per_m2' && (
            <div className="relative">
              <input
                type="number"
                min="0"
                value={m2Value ?? ''}
                onChange={(e) => onUpdateValue({ m2: Number(e.target.value) })}
                className="w-full rounded-xl border border-navy-100 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-navy/40 font-medium">m²</span>
            </div>
          )}
          {node.priceType === 'per_unit' && (
            <div className="relative">
              <input
                type="number"
                min="0"
                value={qtyValue ?? ''}
                onChange={(e) => onUpdateValue({ quantity: Number(e.target.value) })}
                className="w-full rounded-xl border border-navy-100 px-4 py-2.5 pr-16 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-navy/40 font-medium">u.</span>
            </div>
          )}
          {node.priceType === 'fixed' && (
            <p className="text-lg font-display font-bold text-orange">${node.basePrice}</p>
          )}
        </div>
      </div>
    )
  }

  // Consumable / extra: optional
  if (isConsumable) {
    return (
      <div className={`bg-white rounded-2xl border-2 shadow-card p-5 transition ${
        isSelected ? 'border-orange ring-2 ring-orange-500/15' : 'border-navy-100'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-navy">{node.label}</h4>
              <span className="text-[10px] uppercase text-navy/30 bg-navy-50 rounded-full px-2 py-0.5 tracking-wide">Opcional</span>
            </div>
            {node.description && <p className="text-sm text-navy/50 mt-0.5">{node.description}</p>}
          </div>
          <label className="cursor-pointer shrink-0">
            <input type="checkbox" checked={isSelected} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-navy-100 rounded-full peer peer-checked:bg-orange transition-colors relative">
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isSelected ? 'translate-x-5' : ''}`} />
            </div>
          </label>
        </div>
        {isSelected && options.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 animate-[fadeIn_0.2s_ease-out]">
            {options.sort((a, b) => a.order - b.order).map((opt) => {
              const isOptSelected = selection?.optionId === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectOption(opt)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition active:scale-95 ${
                    isOptSelected
                      ? 'border-orange bg-orange text-white'
                      : 'border-navy-100 text-navy hover:bg-orange-50'
                  }`}
                >
                  {opt.label}
                  {opt.basePrice !== null && opt.basePrice > 0 && (
                    <span className="ml-1 opacity-60">${opt.basePrice}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Closing
  if (isClosing) {
    return (
      <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/30 p-5 text-center">
        <h4 className="font-display font-semibold text-navy">{node.label}</h4>
        {node.description && <p className="text-sm text-navy/50 mt-0.5">{node.description}</p>}
      </div>
    )
  }

  return null
}
