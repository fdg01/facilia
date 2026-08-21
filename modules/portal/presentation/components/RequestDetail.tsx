// modules/portal/presentation/components/RequestDetail.tsx
import Link from 'next/link'
import type { ClientRequest, RequestEvent } from '../../domain/portal-entities'

interface RequestDetailProps {
  request: ClientRequest
  events: RequestEvent[]
}

const typeLabels: Record<string, string> = {
  extra_service: 'Servicio extra',
  inquiry: 'Consulta',
  complaint: 'Reclamo',
}

const statusLabels: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En progreso',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
}

const eventLabels: Record<string, string> = {
  created: 'Creada',
  comment: 'Comentario',
  status_change: 'Cambio de estado',
  assigned: 'Asignada',
  resolved: 'Resuelta',
}

export function RequestDetail({ request, events }: RequestDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/portal/requests" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a solicitudes
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {typeLabels[request.type] ?? request.type}
            </span>
            <h1 className="text-xl font-bold">{request.subject}</h1>
          </div>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            {statusLabels[request.status] ?? request.status}
          </span>
        </div>
        <p className="text-gray-600">{request.description}</p>
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>Creada: {new Date(request.createdAt).toLocaleString('es-UY')}</p>
          {request.resolvedAt && (
            <p>Resuelta: {new Date(request.resolvedAt).toLocaleString('es-UY')}</p>
          )}
          {request.resolution && (
            <p className="mt-2 text-gray-700">Resolución: {request.resolution}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Historial</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin eventos</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{eventLabels[e.type] ?? e.type}</p>
                  {e.content && <p className="text-gray-600 text-sm">{e.content}</p>}
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(e.createdAt).toLocaleString('es-UY')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
