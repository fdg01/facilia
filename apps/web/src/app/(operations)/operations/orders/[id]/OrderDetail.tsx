'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiUrl } from '@/lib/api-url'

interface WorkOrder {
  id: string
  number: string
  title: string
  description: string | null
  status: string
  location: string
  scheduledDate: string
  estimatedDurationMin: number
  startedAt: string | null
  finishedAt: string | null
  actualDurationMin: number | null
  slaMet: boolean | null
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

export default function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeIds, setEmployeeIds] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl(`/api/operations/orders/${orderId}`))
        const data = await res.json()
        setOrder(data.data)
      } catch {
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  async function assignPersonnel() {
    const ids = employeeIds.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return
    await fetch(apiUrl(`/api/operations/orders/${orderId}/assign`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds: ids }),
    })
    window.location.reload()
  }

  async function validateExecution() {
    await fetch(apiUrl(`/api/operations/orders/${orderId}/validate`), { method: 'POST' })
    window.location.reload()
  }

  async function cancelOrder() {
    if (!confirm('¿Cancelar esta orden?')) return
    await fetch(apiUrl(`/api/operations/orders/${orderId}/cancel`), { method: 'POST' })
    window.location.reload()
  }

  if (loading) return <div className="text-navy/60">Cargando orden...</div>
  if (!order) return <div className="text-red-600">Orden no encontrada</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/operations/orders" className="text-navy/60 hover:text-navy">← Volver</Link>
        <h1 className="font-display font-bold text-2xl text-navy">{order.number}</h1>
        <span className="px-3 py-1 bg-navy/10 rounded-full text-sm font-medium text-navy">
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-display font-semibold text-lg text-navy mb-4">Detalle</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-navy/60">Título</dt>
                <dd className="font-medium text-navy">{order.title}</dd>
              </div>
              <div>
                <dt className="text-sm text-navy/60">Ubicación</dt>
                <dd className="font-medium text-navy">{order.location}</dd>
              </div>
              <div>
                <dt className="text-sm text-navy/60">Fecha programada</dt>
                <dd className="font-medium text-navy">{order.scheduledDate?.split('T')[0]}</dd>
              </div>
              <div>
                <dt className="text-sm text-navy/60">Duración estimada</dt>
                <dd className="font-medium text-navy">{order.estimatedDurationMin} min</dd>
              </div>
              {order.startedAt && (
                <div>
                  <dt className="text-sm text-navy/60">Iniciada</dt>
                  <dd className="font-medium text-navy">{new Date(order.startedAt).toLocaleString()}</dd>
                </div>
              )}
              {order.finishedAt && (
                <div>
                  <dt className="text-sm text-navy/60">Finalizada</dt>
                  <dd className="font-medium text-navy">{new Date(order.finishedAt).toLocaleString()}</dd>
                </div>
              )}
              {order.actualDurationMin !== null && (
                <div>
                  <dt className="text-sm text-navy/60">Duración real</dt>
                  <dd className="font-medium text-navy">{order.actualDurationMin} min</dd>
                </div>
              )}
              {order.slaMet !== null && (
                <div>
                  <dt className="text-sm text-navy/60">SLA cumplido</dt>
                  <dd className={`font-medium ${order.slaMet ? 'text-green-600' : 'text-red-600'}`}>
                    {order.slaMet ? 'Sí' : 'No'}
                  </dd>
                </div>
              )}
            </dl>
            {order.description && (
              <div className="mt-4 pt-4 border-t border-navy/10">
                <p className="text-sm text-navy/60 mb-1">Descripción</p>
                <p className="text-navy">{order.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {order.status === 'created' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-display font-semibold text-lg text-navy mb-4">Asignar personal</h2>
              <p className="text-sm text-navy/60 mb-3">Ingresa los IDs de empleados separados por coma</p>
              <textarea
                value={employeeIds}
                onChange={(e) => setEmployeeIds(e.target.value)}
                className="w-full px-3 py-2 border border-navy/20 rounded-lg text-sm"
                rows={3}
                placeholder="uuid-empleado-1, uuid-empleado-2"
              />
              <button
                onClick={assignPersonnel}
                className="mt-3 w-full px-4 py-2 bg-orange text-white font-medium rounded-xl hover:bg-orange/90"
              >
                Asignar
              </button>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-display font-semibold text-lg text-navy mb-4">Validar ejecución</h2>
              <button
                onClick={validateExecution}
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700"
              >
                Validar
              </button>
            </div>
          )}

          {!['validated', 'cancelled'].includes(order.status) && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <button
                onClick={cancelOrder}
                className="w-full px-4 py-2 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200"
              >
                Cancelar orden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
