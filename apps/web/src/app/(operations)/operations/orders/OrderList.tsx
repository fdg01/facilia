'use client'

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

export default function OrderList() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const url = `/api/operations/orders?page=1&pageSize=50${statusFilter ? `&status=${statusFilter}` : ''}`
        const res = await fetch(url)
        const data = await res.json()
        setOrders(data.data ?? [])
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter])

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Órdenes de Trabajo</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-full text-sm ${!statusFilter ? 'bg-navy text-white' : 'bg-white text-navy/70 border border-navy/10'}`}
        >
          Todas
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === key ? 'bg-navy text-white' : 'bg-white text-navy/70 border border-navy/10'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-navy/60">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-8 text-center text-navy/60">
          No hay órdenes de trabajo
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Número</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Título</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Ubicación</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-navy/70">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-navy/2">
                  <td className="px-4 py-3 text-sm font-medium text-navy">{o.number}</td>
                  <td className="px-4 py-3 text-sm text-navy">{o.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[o.status] ?? 'bg-gray-100'}`}>
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy/70">{o.location}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{o.scheduledDate?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/operations/orders/${o.id}`} className="text-sm text-navy/60 hover:text-navy">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
