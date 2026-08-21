// modules/portal/presentation/components/Dashboard.tsx
import Link from 'next/link'
import type { DashboardData } from '../../domain/types'
import { StatusChip } from './StatusChip'

interface DashboardProps {
  data: DashboardData
  userName: string
}

export function Dashboard({ data, userName }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hola, {userName}</h1>
          <p className="text-gray-600 text-sm mt-1">Resumen de tu actividad en FACILIA</p>
        </div>
        <Link
          href="/portal/quote"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-white font-medium hover:bg-orange-700 transition"
        >
          + Nueva cotización
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">Total cotizaciones</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalLeads}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">Pendientes de respuesta</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{data.pendingLeads}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">Acciones rápidas</p>
          <div className="mt-3 space-y-2">
            <Link href="/portal/leads" className="block text-blue-600 hover:underline text-sm">
              Ver mis cotizaciones →
            </Link>
            <Link href="/portal/quote" className="block text-blue-600 hover:underline text-sm">
              Armar nueva cotización →
            </Link>
          </div>
        </div>
      </div>

      {data.recentLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Últimas cotizaciones</h2>
            <Link href="/portal/leads" className="text-blue-600 hover:underline text-sm">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/portal/leads/${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium text-gray-900">{lead.number}</span>
                  <StatusChip status={lead.status} />
                </div>
                <div className="text-right">
                  <span className="font-semibold text-orange-600">${lead.totalMonthly.toFixed(2)}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(lead.createdAt).toLocaleDateString('es-UY')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
