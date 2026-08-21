// modules/portal/presentation/components/ServiceDetail.tsx
import Link from 'next/link'
import type { ServiceSummary, ServiceEvent } from '../../domain/portal-entities'

interface ServiceDetailProps {
  service: ServiceSummary
  events: ServiceEvent[]
}

const eventLabels: Record<string, string> = {
  visit_completed: 'Visita completada',
  product_delivered: 'Producto entregado',
  incident_reported: 'Incidencia reportada',
  service_started: 'Servicio iniciado',
  service_paused: 'Servicio pausado',
  service_resumed: 'Servicio reanudado',
  evidence_added: 'Evidencia agregada',
}

export function ServiceDetail({ service, events }: ServiceDetailProps) {
  return (
    <div className="space-y-6">
      <Link href="/portal/services" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a servicios
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold">{service.description}</h1>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {service.frequency && (
            <div>
              <p className="text-gray-500">Frecuencia</p>
              <p className="font-medium">{service.frequency}</p>
            </div>
          )}
          {service.scope && (
            <div>
              <p className="text-gray-500">Alcance</p>
              <p className="font-medium">{service.scope}</p>
            </div>
          )}
          {service.nextVisit && (
            <div>
              <p className="text-gray-500">Próxima visita</p>
              <p className="font-medium">{service.nextVisit.split('T')[0]}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Iteraciones del servicio</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay eventos registrados</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-600 mt-1.5" />
                  {events.indexOf(e) < events.length - 1 && (
                    <div className="w-px h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">{eventLabels[e.type] ?? e.type}</p>
                  <p className="text-gray-600 text-sm">{e.description}</p>
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
