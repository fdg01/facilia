// modules/portal/presentation/components/RequestList.tsx
import Link from 'next/link'
import type { ClientRequest } from '../../domain/portal-entities'

interface RequestListProps {
  requests: ClientRequest[]
}

const typeLabels: Record<string, string> = {
  extra_service: 'Servicio extra',
  inquiry: 'Consulta',
  complaint: 'Reclamo',
}

const typeColors: Record<string, string> = {
  extra_service: 'bg-blue-100 text-blue-800',
  inquiry: 'bg-gray-100 text-gray-700',
  complaint: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En progreso',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  open: 'bg-orange-100 text-orange-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

export function RequestList({ requests }: RequestListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Mis solicitudes</h1>
        <Link
          href="/portal/requests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700 transition text-sm"
        >
          + Nueva solicitud
        </Link>
      </div>
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No tienes solicitudes
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/portal/requests/${r.id}`}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[r.type] ?? 'bg-gray-100'}`}>
                    {typeLabels[r.type] ?? r.type}
                  </span>
                  <p className="font-medium">{r.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] ?? 'bg-gray-100'}`}>
                    {statusLabels[r.status] ?? r.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('es-UY')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
