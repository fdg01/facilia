// modules/portal/presentation/components/CommunicationList.tsx
import Link from 'next/link'
import type { Communication } from '../../domain/portal-entities'

interface CommunicationListProps {
  communications: Communication[]
  unread: number
}

const typeLabels: Record<string, string> = {
  info: 'Información',
  visit_scheduled: 'Visita programada',
  service_completed: 'Servicio completado',
  incident: 'Incidencia',
  payment: 'Pago',
  custom: 'Mensaje',
}

export function CommunicationList({ communications, unread }: CommunicationListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Comunicaciones</h1>
        {unread > 0 && (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            {unread} sin leer
          </span>
        )}
      </div>
      {communications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No tienes comunicaciones
        </div>
      ) : (
        <div className="space-y-2">
          {communications.map((c) => (
            <Link
              key={c.id}
              href={`/portal/communications/${c.id}`}
              className={`block bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition ${
                !c.read ? 'border-l-4 border-l-orange-600' : ''
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {!c.read && <div className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${!c.read ? 'font-semibold' : 'font-medium'}`}>
                      {c.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {typeLabels[c.type] ?? c.type}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(c.createdAt).toLocaleDateString('es-UY')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
