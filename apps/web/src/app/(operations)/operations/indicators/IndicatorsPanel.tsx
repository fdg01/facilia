'use client'

import { apiUrl } from "@/lib/api-url"
import { useEffect, useState } from 'react'

interface Indicators {
  avgActualDurationMin: number
  avgEstimatedDurationMin: number
  slaCompliancePct: number
  completedOrders: number
  ordersWithIncidents: number
  performanceByEmployee: Array<{
    employeeId: string
    employeeName: string
    completedOrders: number
    avgDurationMin: number
    slaCompliancePct: number
  }>
}

export default function IndicatorsPanel() {
  const [data, setData] = useState<Indicators | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/operations/indicators'))
        const json = await res.json()
        setData(json.data)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-navy/60">Cargando indicadores...</div>
  if (!data) return <div className="text-red-600">Error al cargar</div>

  const cards = [
    { label: 'Duración real promedio', value: `${data.avgActualDurationMin} min` },
    { label: 'Duración estimada promedio', value: `${data.avgEstimatedDurationMin} min` },
    { label: 'Cumplimiento SLA', value: `${data.slaCompliancePct}%` },
    { label: 'Órdenes completadas', value: data.completedOrders },
    { label: 'Órdenes con incidencias', value: data.ordersWithIncidents },
  ]

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Indicadores</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-card p-6">
            <p className="text-sm text-navy/60 mb-1">{c.label}</p>
            <p className="font-display font-bold text-3xl text-navy">{c.value}</p>
          </div>
        ))}
      </div>
      {data.performanceByEmployee.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg text-navy mb-4">Desempeño por empleado</h2>
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-navy/70">Empleado</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-navy/70">Completadas</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-navy/70">Duración prom.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-navy/70">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {data.performanceByEmployee.map((e) => (
                <tr key={e.employeeId}>
                  <td className="px-4 py-2 text-sm text-navy">{e.employeeName}</td>
                  <td className="px-4 py-2 text-sm text-navy">{e.completedOrders}</td>
                  <td className="px-4 py-2 text-sm text-navy">{e.avgDurationMin} min</td>
                  <td className="px-4 py-2 text-sm text-navy">{e.slaCompliancePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

