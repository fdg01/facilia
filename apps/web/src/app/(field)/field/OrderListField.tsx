'use client'

import { apiUrl } from "@/lib/api-url"
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WorkOrder {
  id: string
  number: string
  title: string
  status: string
  location: string
  scheduledDate: string
}

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  assigned: 'bg-orange/20 text-orange',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  validated: 'bg-green-200 text-green-900',
  with_incidents: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

const statusLabels: Record<string, string> = {
  created: 'Creada',
  assigned: 'Asignada',
  accepted: 'Aceptada',
  in_progress: 'En progreso',
  completed: 'Completada',
  validated: 'Validada',
  with_incidents: 'Con incidencias',
  cancelled: 'Cancelada',
}

const ctaLabels: Record<string, string> = {
  assigned: 'Aceptar',
  accepted: 'Iniciar',
  in_progress: 'Completar',
}

export default function OrderListField() {
  const [orders, setOrders] = useState<Record<string, WorkOrder>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/operations/orders?page=1&pageSize=100'))
        const data = await res.json()
        const orderList = (data.data ?? []) as WorkOrder[]
        const orderMap: Record<string, WorkOrder> = {}
        orderList.forEach((o) => { orderMap[o.id] = o })
        setOrders(orderMap)
      } catch {
        setOrders({})
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-navy/60">Cargando órdenes...</div>

  const orderList = Object.values(orders)
  const filtered = filter ? orderList.filter((o) => o.status === filter) : orderList

  return (
    <div>
      <h1 className="font-display font-bold text-xl text-navy mb-4">Mis órdenes</h1>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${!filter ? 'bg-navy text-white' : 'bg-white text-navy/70 border border-navy/10'}`}
        >
          Todas
        </button>
        {['assigned', 'accepted', 'in_progress', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filter === s ? 'bg-navy text-white' : 'bg-white text-navy/70 border border-navy/10'}`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-navy/60">
          No tienes órdenes asignadas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/field/orders/${o.id}`}
              className="block bg-white rounded-2xl shadow-card p-4 active:bg-navy/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-base text-navy truncate">{o.title}</p>
                  <p className="text-navy/70 text-sm">{o.location}</p>
                  <p className="text-navy/50 text-xs mt-1">{o.number} · {o.scheduledDate?.split('T')[0]}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[o.status] ?? 'bg-gray-100'}`}>
                  {statusLabels[o.status] ?? o.status}
                </span>
              </div>
              {ctaLabels[o.status] && (
                <div className="mt-2">
                  <span className="inline-block px-4 py-2 bg-orange text-white text-sm font-medium rounded-xl">
                    {ctaLabels[o.status]}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

