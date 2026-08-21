'use client'

import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api-url'

interface PlanActivity {
  activity: string
  description: string
  frequency: string
  cronRule: string | null
  location: string
  estimatedDurationMin: number
}

interface OperationalPlan {
  id: string
  contractId: string
  status: string
  activities: PlanActivity[]
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  special_rule: 'Regla especial',
}

export default function OperationalPlanEditor({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<OperationalPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleResult, setScheduleResult] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl(`/api/operations/plans/${planId}`))
        const data = await res.json()
        setPlan(data.data)
      } catch {
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [planId])

  async function activatePlan() {
    await fetch(apiUrl(`/api/operations/plans/${planId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    window.location.reload()
  }

  async function scheduleVisits() {
    if (!fromDate || !toDate) return
    setScheduling(true)
    try {
      const res = await fetch(apiUrl(`/api/operations/plans/${planId}/schedule`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate, toDate }),
      })
      const data = await res.json()
      setScheduleResult(`Se generaron ${data.data?.servicesGenerated ?? 0} servicios`)
    } catch {
      setScheduleResult('Error al programar')
    } finally {
      setScheduling(false)
    }
  }

  if (loading) return <div className="text-navy/60">Cargando plan...</div>
  if (!plan) return <div className="text-red-600">Plan no encontrado</div>

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Plan Operativo</h1>
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-navy/60">Estado</p>
            <p className="font-medium text-navy">{plan.status}</p>
          </div>
          {plan.status === 'draft' && (
            <button
              onClick={activatePlan}
              className="px-4 py-2 bg-orange text-white font-medium rounded-xl hover:bg-orange/90"
            >
              Activar plan
            </button>
          )}
        </div>
        <h2 className="font-display font-semibold text-lg text-navy mb-3">Actividades</h2>
        {plan.activities.length === 0 ? (
          <p className="text-navy/60">Sin actividades definidas</p>
        ) : (
          <div className="space-y-3">
            {plan.activities.map((a, i) => (
              <div key={i} className="border border-navy/10 rounded-xl p-4">
                <p className="font-medium text-navy">{a.activity}</p>
                <p className="text-sm text-navy/60">{a.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-navy/70">
                  <span>Frecuencia: {frequencyLabels[a.frequency] ?? a.frequency}</span>
                  <span>Ubicación: {a.location}</span>
                  <span>Duración: {a.estimatedDurationMin} min</span>
                  {a.cronRule && <span>Regla: {a.cronRule}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {plan.status === 'active' && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg text-navy mb-4">Programar visitas</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm text-navy/60 mb-1">Desde</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 border border-navy/20 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-navy/60 mb-1">Hasta</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 border border-navy/20 rounded-lg" />
            </div>
            <button
              onClick={scheduleVisits}
              disabled={scheduling || !fromDate || !toDate}
              className="px-4 py-2 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 disabled:opacity-50"
            >
              {scheduling ? 'Programando...' : 'Programar'}
            </button>
          </div>
          {scheduleResult && <p className="mt-3 text-sm text-green-600">{scheduleResult}</p>}
        </div>
      )}
    </div>
  )
}
