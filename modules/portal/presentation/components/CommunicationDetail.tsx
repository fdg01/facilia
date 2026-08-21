// modules/portal/presentation/components/CommunicationDetail.tsx
import Link from 'next/link'
import type { Communication } from '../../domain/portal-entities'

interface CommunicationDetailProps {
  communication: Communication
}

const typeLabels: Record<string, string> = {
  info: 'Información',
  visit_scheduled: 'Visita programada',
  service_completed: 'Servicio completado',
  incident: 'Incidencia',
  payment: 'Pago',
  custom: 'Mensaje',
}

export function CommunicationDetail({ communication }: CommunicationDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/portal/communications" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a comunicaciones
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {typeLabels[communication.type] ?? communication.type}
          </span>
        </div>
        <h1 className="text-xl font-bold mb-4">{communication.subject}</h1>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{communication.body}</p>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>{new Date(communication.createdAt).toLocaleString('es-UY')}</p>
        </div>
      </div>
    </div>
  )
}
