'use client'

import { apiUrl } from "@/lib/api-url"
import { useState, useEffect, useCallback } from 'react'

type Tab = 'variables' | 'consumables' | 'parameters' | 'rules' | 'gift'

export function ConfigPanel() {
  const [tab, setTab] = useState<Tab>('variables')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'variables', label: 'Variables' },
    { id: 'consumables', label: 'Insumos' },
    { id: 'parameters', label: 'Parámetros' },
    { id: 'rules', label: 'Reglas' },
    { id: 'gift', label: 'Regalo de bienvenida' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configuración</h2>
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition ${
              tab === t.id
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'variables' && <VariablesTab />}
      {tab === 'consumables' && <ConsumablesTab />}
      {tab === 'parameters' && <ParametersTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'gift' && <GiftTab />}
    </div>
  )
}

function VariablesTab() {
  const [items, setItems] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/admin/variables')).then(r => r.json()).then(j => {
      setItems(j.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-3">
      {(items as Record<string, unknown>[]).map((v) => (
        <div key={v.id as string} className="p-3 border rounded-lg flex justify-between">
          <div>
            <p className="font-medium">{v.label as string} <span className="text-xs text-gray-500">({v.code as string})</span></p>
            <p className="text-sm text-gray-600">Tipo: {v.type as string}</p>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500">No hay variables configuradas.</p>}
    </div>
  )
}

function ConsumablesTab() {
  const [items, setItems] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/admin/consumables')).then(r => r.json()).then(j => {
      setItems(j.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-3">
      {(items as Record<string, unknown>[]).map((c) => (
        <div key={c.id as string} className="p-3 border rounded-lg">
          <p className="font-medium">{c.label as string} <span className="text-xs text-gray-500">({c.code as string})</span></p>
          <p className="text-sm text-gray-600">
            Precio: ${Number(c.unit_price ?? c.unitPrice ?? 0).toFixed(2)} ·
            Modo: {c.quantity_mode as string ?? c.quantityMode as string}
          </p>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500">No hay insumos configurados.</p>}
    </div>
  )
}

function ParametersTab() {
  const [data, setData] = useState<{ active: Record<string, unknown> | null; audit: unknown[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ operatorHourlyCost: '', marginPercentage: '', marginMode: 'on_cost' })

  const load = useCallback(() => {
    fetch(apiUrl('/api/admin/parameters')).then(r => r.json()).then(j => {
      setData(j.data)
      if (j.data?.active) {
        setForm({
          operatorHourlyCost: String(j.data.active.operatorHourlyCost ?? j.data.active.operator_hourly_cost ?? ''),
          marginPercentage: String(j.data.active.marginPercentage ?? j.data.active.margin_percentage ?? ''),
          marginMode: j.data.active.marginMode ?? j.data.active.margin_mode ?? 'on_cost',
        })
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    await fetch(apiUrl('/api/admin/parameters'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorHourlyCost: Number(form.operatorHourlyCost),
        marginPercentage: Number(form.marginPercentage),
        marginMode: form.marginMode,
      }),
    })
    load()
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg space-y-3">
        <h3 className="font-semibold">Parámetros actuales</h3>
        <div>
          <label className="block text-sm mb-1">Costo por hora del operario</label>
          <input type="number" value={form.operatorHourlyCost} onChange={(e) => setForm(f => ({ ...f, operatorHourlyCost: e.target.value }))} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Margen (%)</label>
          <input type="number" value={form.marginPercentage} onChange={(e) => setForm(f => ({ ...f, marginPercentage: e.target.value }))} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Modo de margen</label>
          <select value={form.marginMode} onChange={(e) => setForm(f => ({ ...f, marginMode: e.target.value }))} className="w-full rounded border px-3 py-2">
            <option value="on_cost">Sobre costo</option>
            <option value="on_final_price">Sobre precio final</option>
          </select>
        </div>
        <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Guardar
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Historial de cambios</h3>
        <div className="space-y-2">
          {(data?.audit as Record<string, unknown>[])?.map((a, i) => (
            <div key={i} className="p-2 border rounded text-sm">
              <span className="font-medium">{a.action as string}</span> —{' '}
              {new Date(a.created_at as string ?? a.createdAt as string).toLocaleString('es-UY')}
            </div>
          ))}
          {(!data?.audit || (data.audit as unknown[]).length === 0) && (
            <p className="text-gray-500 text-sm">Sin historial.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function RulesTab() {
  const [items, setItems] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/admin/rules')).then(r => r.json()).then(j => {
      setItems(j.data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-3">
      {(items as Record<string, unknown>[]).map((r) => (
        <div key={r.id as string} className="p-3 border rounded-lg">
          <p className="font-medium">{r.label as string} <span className="text-xs text-gray-500">({r.code as string})</span></p>
          <p className="text-sm text-gray-600">Tipo: {r.type as string}</p>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500">No hay reglas configuradas.</p>}
    </div>
  )
}

function GiftTab() {
  const [gift, setGift] = useState<{ description: string; active: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/admin/welcome-gift')).then(r => r.json()).then(j => {
      setGift(j.data)
      setLoading(false)
    })
  }, [])

  const save = async () => {
    if (!gift) return
    await fetch(apiUrl('/api/admin/welcome-gift'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gift),
    })
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="p-4 border rounded-lg space-y-3 max-w-md">
      <h3 className="font-semibold">Regalo de bienvenida</h3>
      <div>
        <label className="block text-sm mb-1">Descripción</label>
        <textarea
          value={gift?.description ?? ''}
          onChange={(e) => setGift(g => ({ description: e.target.value, active: g?.active ?? true }))}
          className="w-full rounded border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={gift?.active ?? false}
            onChange={(e) => setGift(g => ({ description: g?.description ?? '', active: e.target.checked }))}
          />
          Activo
        </label>
      </div>
      <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Guardar
      </button>
    </div>
  )
}

