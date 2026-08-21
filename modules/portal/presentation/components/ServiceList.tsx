// modules/portal/presentation/components/ServiceList.tsx
import Link from 'next/link'
import type { ServiceSummary } from '../../domain/portal-entities'

interface ServiceListProps {
  services: ServiceSummary[]
}

const lineLabels: Record<string, string> = {
  clean: 'FACILIA Clean',
  care: 'FACILIA Care',
  continuity: 'FACILIA Continuity',
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  special_rule: 'Regla especial',
}

export function ServiceList({ services }: ServiceListProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis servicios</h1>
      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No tienes servicios contratados
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/portal/services/${s.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
            >
              {s.line && (
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                  {lineLabels[s.line] ?? s.line}
                </p>
              )}
              <p className="font-semibold text-lg text-gray-900 mt-1">{s.description}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {s.frequency && (
                  <p>Frecuencia: {frequencyLabels[s.frequency] ?? s.frequency}</p>
                )}
                {s.scope && <p>Alcance: {s.scope}</p>}
                {s.nextVisit && <p>Próxima visita: {s.nextVisit.split('T')[0]}</p>}
              </div>
              <span className="inline-block mt-3 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {s.status === 'active' ? 'Activo' : s.status === 'paused' ? 'Pausado' : 'Finalizado'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
