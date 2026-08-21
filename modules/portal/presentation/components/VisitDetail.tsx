// modules/portal/presentation/components/VisitDetail.tsx
import Link from 'next/link'
import type { CalendarVisit, EvidenceItem } from '../../domain/portal-entities'

interface VisitDetailProps {
  serviceId: string
  visit: CalendarVisit | null
  evidence: EvidenceItem[]
}

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-600',
}

export function VisitDetail({ serviceId, visit, evidence }: VisitDetailProps) {
  if (!visit) {
    return (
      <div className="space-y-4">
        <Link href={`/portal/services/${serviceId}`} className="text-gray-600 hover:text-gray-900 text-sm">
          ← Volver al servicio
        </Link>
        <div className="text-center text-gray-500 py-12">Visita no encontrada</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href={`/portal/services/${serviceId}`} className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver al servicio
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{visit.serviceDescription}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[visit.status] ?? 'bg-gray-100'}`}>
            {statusLabels[visit.status] ?? visit.status}
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Fecha: {visit.date.split('T')[0]}</p>
          {visit.timeWindow && <p>Horario: {visit.timeWindow}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Evidencias</h2>
        {evidence.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay evidencias autorizadas para esta visita</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {evidence.map((e) => (
              <a
                key={e.id}
                href={e.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                {e.type === 'photo' ? (
                  <img src={e.signedUrl} alt={e.description} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-50">
                    <span className="text-sm text-gray-500">{e.type}</span>
                  </div>
                )}
                <p className="p-2 text-xs text-gray-600 truncate">{e.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
