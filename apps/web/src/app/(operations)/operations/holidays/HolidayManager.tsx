'use client'

import { apiUrl } from "@/lib/api-url"
import { useEffect, useState } from 'react'

interface Holiday {
  id: string
  date: string
  description: string
  scope: string
  organizationId: string | null
}

const scopeLabels: Record<string, string> = {
  national: 'Nacional',
  departmental: 'Departamental',
  organization: 'Organización',
}

export default function HolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState('national')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetch(apiUrl('/api/operations/holidays'))
      const data = await res.json()
      setHolidays(data.data ?? [])
    } catch {
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }

  async function createHoliday() {
    if (!date || !description) return
    await fetch(apiUrl('/api/operations/holidays'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, description, scope }),
    })
    setDate('')
    setDescription('')
    load()
  }

  if (loading) return <div className="text-navy/60">Cargando feriados...</div>

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Feriados</h1>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <h2 className="font-display font-semibold text-lg text-navy mb-4">Agregar feriado</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-navy/60 mb-1">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-navy/20 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-navy/60 mb-1">Descripción</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-navy/20 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-navy/60 mb-1">Alcance</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full px-3 py-2 border border-navy/20 rounded-lg">
              <option value="national">Nacional</option>
              <option value="departmental">Departamental</option>
              <option value="organization">Organización</option>
            </select>
          </div>
        </div>
        <button
          onClick={createHoliday}
          disabled={!date || !description}
          className="mt-3 px-4 py-2 bg-orange text-white font-medium rounded-xl hover:bg-orange/90 disabled:opacity-50"
        >
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-navy/5">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Descripción</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Alcance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {holidays.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3 text-sm text-navy">{h.date?.split('T')[0]}</td>
                <td className="px-4 py-3 text-sm text-navy">{h.description}</td>
                <td className="px-4 py-3 text-sm text-navy/70">{scopeLabels[h.scope] ?? h.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {holidays.length === 0 && (
          <div className="p-8 text-center text-navy/60">No hay feriados cargados</div>
        )}
      </div>
    </div>
  )
}

