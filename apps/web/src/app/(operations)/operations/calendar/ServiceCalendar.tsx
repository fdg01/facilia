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

export default function ServiceCalendar() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/operations/orders?page=1&pageSize=200'))
        const data = await res.json()
        setOrders(data.data ?? [])
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-navy/60">Cargando calendario...</div>

  const ordersByDate = orders.reduce<Record<string, WorkOrder[]>>((acc, o) => {
    const date = o.scheduledDate?.split('T')[0]
    if (date) {
      acc[date] = acc[date] ?? []
      acc[date].push(o)
    }
    return acc
  }, {})

  const todayOrders = ordersByDate[selectedDate] ?? []

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-6">Calendario</h1>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="mb-4">
          <label className="block text-sm text-navy/60 mb-1">Seleccionar fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-navy/20 rounded-lg"
          />
        </div>
        <h2 className="font-display font-semibold text-lg text-navy mb-3">
          Órdenes del {selectedDate}
        </h2>
        {todayOrders.length === 0 ? (
          <p className="text-navy/60">No hay órdenes programadas</p>
        ) : (
          <div className="space-y-2">
            {todayOrders.map((o) => (
              <Link
                key={o.id}
                href={`/operations/orders/${o.id}`}
                className="block border border-navy/10 rounded-xl p-3 hover:bg-navy/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">{o.title}</p>
                    <p className="text-sm text-navy/60">{o.number} · {o.location}</p>
                  </div>
                  <span className="text-xs text-navy/70">{o.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

