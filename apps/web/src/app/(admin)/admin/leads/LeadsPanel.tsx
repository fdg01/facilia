'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '@/lib/api-url'

interface Lead {
  id: string
  number: string
  status: string
  name: string
  email: string
  phone: string
  totalMonthly: number | null
  totalPerVisit: number | null
  mainLine: string | null
  giftIncluded: boolean
  createdAt: string
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  lost: 'Perdido',
  confirmed: 'Confirmado',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  confirmed: 'bg-purple-100 text-purple-700',
}

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const url = filter ? `/api/leads?status=${filter}` : '/api/leads'
    fetch(url).then(r => r.json()).then(j => {
      setLeads(j.data ?? [])
      setLoading(false)
    })
  }, [filter])

  useEffect(() => {
    let cancelled = false
    const doLoad = async () => {
      setLoading(true)
      const url = filter ? `/api/leads?status=${filter}` : '/api/leads'
      const res = await fetch(url)
      const json = await res.json()
      if (!cancelled) {
        setLeads(json.data ?? [])
        setLoading(false)
      }
    }
    doLoad()
    return () => { cancelled = true }
  }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Panel Comercial</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="sent">Enviados</option>
          <option value="accepted">Aceptados</option>
          <option value="lost">Perdidos</option>
          <option value="confirmed">Confirmados</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : leads.length === 0 ? (
        <p className="text-gray-500">No hay leads para mostrar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="py-2 px-3">Número</th>
                <th className="py-2 px-3">Cliente</th>
                <th className="py-2 px-3">Línea</th>
                <th className="py-2 px-3">Mensual</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono">{lead.number}</td>
                  <td className="py-2 px-3">{lead.name}</td>
                  <td className="py-2 px-3">{lead.mainLine ?? '—'}</td>
                  <td className="py-2 px-3">${(lead.totalMonthly ?? 0).toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[lead.status] ?? ''}`}>
                      {statusLabels[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {new Date(lead.createdAt).toLocaleDateString('es-UY')}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-blue-600 hover:underline"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => { load(); setSelectedLead(null) }}
        />
      )}
    </div>
  )
}

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
  onUpdated: () => void
}

interface LeadDetail {
  id: string
  number: string
  status: string
  name: string
  email: string
  phone: string
  selections: { nodeId: string; optionId: string | null; value: Record<string, unknown> | null }[]
  snapshot: { detail: Record<string, unknown>; parameters: Record<string, unknown>; dag: Record<string, unknown> } | null
}

function LeadDetailModal({ lead, onClose, onUpdated }: LeadDetailModalProps) {
  const [detail, setDetail] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    fetch(apiUrl(`/api/leads/${lead.id}`)).then(r => r.json()).then(j => {
      setDetail(j.data as LeadDetail)
      setLoading(false)
    })
  }, [lead.id])

  const changeStatus = async () => {
    if (!newStatus) return
    await fetch(apiUrl(`/api/leads/${lead.id}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    onUpdated()
  }

  const associateOrg = async () => {
    if (!orgId) return
    await fetch(apiUrl(`/api/leads/${lead.id}/organization`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId }),
    })
    onUpdated()
  }

  const redownload = async () => {
    const res = await fetch(apiUrl(`/api/leads/${lead.id}/redownload`), { method: 'POST' })
    const json = await res.json()
    if (json.data?.pdfUrl) {
      window.open(json.data.pdfUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">{lead.number}</h3>
            <p className="text-sm text-gray-600">{lead.name} — {lead.email} — {lead.phone}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {loading ? (
          <p>Cargando detalle...</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Mensual:</strong> ${(lead.totalMonthly ?? 0).toFixed(2)}</div>
              <div><strong>Por visita:</strong> ${(lead.totalPerVisit ?? 0).toFixed(2)}</div>
              <div><strong>Línea:</strong> {lead.mainLine}</div>
              <div><strong>Regalo:</strong> {lead.giftIncluded ? 'Sí' : 'No'}</div>
            </div>

            {detail?.selections && detail.selections.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-1">Selecciones</p>
                <div className="space-y-1 text-sm">
                  {detail.selections.map((s, i) => (
                    <div key={i} className="text-gray-600">
                      Nodo: {s.nodeId}
                      {s.value && <span> — {JSON.stringify(s.value)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-3 space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Cambiar estado</p>
                <div className="flex gap-2">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex-1 rounded border px-3 py-2 text-sm">
                    <option value="">Seleccionar...</option>
                    <option value="accepted">Aceptado</option>
                    <option value="lost">Perdido</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="sent">Reenviar (volver a enviado)</option>
                  </select>
                  <button onClick={changeStatus} disabled={!newStatus} className="rounded bg-blue-600 px-4 py-2 text-white text-sm disabled:opacity-50">
                    Aplicar
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-1">Asociar organización</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="UUID de organización"
                    className="flex-1 rounded border px-3 py-2 text-sm"
                  />
                  <button onClick={associateOrg} disabled={!orgId} className="rounded bg-blue-600 px-4 py-2 text-white text-sm disabled:opacity-50">
                    Asociar
                  </button>
                </div>
              </div>

              <div>
                <button onClick={redownload} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
