'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api-url'

interface DashboardData {
  todayOrders: number
  pendingAssignment: number
  openIncidents: number
  slaToday: number
}

export default function OperationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const todayRes = await fetch(apiUrl(`/api/operations/orders?page=1&pageSize=100`))
        const todayData = await todayRes.json()
        const todayOrders = (todayData.data ?? []).filter((o: { scheduledDate: string }) => o.scheduledDate?.startsWith(today)).length
        const pendingAssignment = (todayData.data ?? []).filter((o: { status: string }) => o.status === 'created').length
        setData({
          todayOrders,
          pendingAssignment,
          openIncidents: 0,
          slaToday: 0,
        })
      } catch {
        setData({ todayOrders: 0, pendingAssignment: 0, openIncidents: 0, slaToday: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-navy/60">Cargando dashboard...</div>
  if (!data) return <div className="text-red-600">Error al cargar</div>

  const cards = [
    { label: 'Órdenes del día', value: data.todayOrders, color: 'text-navy' },
    { label: 'Pendientes de asignar', value: data.pendingAssignment, color: 'text-orange' },
    { label: 'Incidencias abiertas', value: data.openIncidents, color: 'text-red-600' },
    { label: 'SLA del día', value: `${data.slaToday}%`, color: 'text-green-600' },
  ]

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Panel de Operaciones</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-card p-6">
            <p className="text-sm text-navy/60 mb-1">{c.label}</p>
            <p className={`font-display font-bold text-3xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/operations/contracts" className="px-4 py-2 bg-orange text-white font-medium rounded-xl hover:bg-orange/90 transition-colors">
          Ver contratos
        </Link>
        <Link href="/operations/orders" className="px-4 py-2 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 transition-colors">
          Ver órdenes
        </Link>
      </div>
    </div>
  )
}
