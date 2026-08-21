// modules/portal/presentation/components/DashboardSummary.tsx
import Link from 'next/link'
import type { ExtendedDashboardData } from '../../domain/portal-entities'

interface DashboardSummaryProps {
  data: ExtendedDashboardData
  userName: string
}

export function DashboardSummary({ data, userName }: DashboardSummaryProps) {
  const cards = [
    { label: 'Servicios activos', value: data.activeServices, color: 'text-navy', href: '/portal/services' },
    { label: 'Próxima visita', value: data.nextVisit ?? '—', color: 'text-blue-600', href: '/portal/calendar' },
    { label: 'Solicitudes abiertas', value: data.openRequests, color: 'text-orange-600', href: '/portal/requests' },
    { label: 'Comunicaciones sin leer', value: data.unreadCommunications, color: 'text-red-600', href: '/portal/communications' },
  ]

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-2 ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">Total cotizaciones</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalLeads}</p>
          <p className="text-sm text-orange-600 mt-1">{data.pendingLeads} pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500">Acciones rápidas</p>
          <div className="mt-3 space-y-2">
            <Link href="/portal/services" className="block text-blue-600 hover:underline text-sm">
              Ver mis servicios →
            </Link>
            <Link href="/portal/requests/new" className="block text-blue-600 hover:underline text-sm">
              Crear solicitud →
            </Link>
            <Link href="/portal/communications" className="block text-blue-600 hover:underline text-sm">
              Ver comunicaciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
