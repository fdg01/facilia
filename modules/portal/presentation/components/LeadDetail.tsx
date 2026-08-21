// modules/portal/presentation/components/LeadDetail.tsx
import Link from 'next/link'
import type { LeadDetail as LeadDetailType } from '../../domain/types'
import { StatusChip } from './StatusChip'
import { PdfButton } from './PdfButton'

const lineLabels: Record<string, string> = {
  clean: 'FACILIA Clean',
  care: 'FACILIA Care',
  continuity: 'FACILIA Continuity',
}

interface LeadDetailProps {
  lead: LeadDetailType
}

export function LeadDetail({ lead }: LeadDetailProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{lead.number}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(lead.createdAt).toLocaleString('es-UY')}
            </p>
          </div>
          <StatusChip status={lead.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium">{lead.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{lead.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Teléfono</p>
            <p className="font-medium">{lead.phone}</p>
          </div>
          {lead.mainLine && (
            <div>
              <p className="text-gray-500">Línea</p>
              <p className="font-medium">{lineLabels[lead.mainLine] ?? lead.mainLine}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Totales</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Costo mensual:</span>
            <span className="font-bold text-orange-600">${lead.totalMonthly.toFixed(2)}</span>
          </div>
          {lead.totalPerVisit > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Costo por visita:</span>
              <span className="font-semibold">${lead.totalPerVisit.toFixed(2)}</span>
            </div>
          )}
        </div>

        {lead.giftIncluded && lead.giftDescription && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <p className="font-semibold text-amber-800 text-sm">REGALO DE BIENVENIDA</p>
            <p className="text-amber-700 text-sm mt-1">{lead.giftDescription} (sin costo)</p>
          </div>
        )}
      </div>

      {lead.selections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Detalle de la cotización</h2>
          <div className="space-y-2">
            {lead.selections.map((sel, i) => (
              <div key={i} className="text-sm text-gray-600">
                <span className="font-medium">Nodo:</span> {sel.nodeId}
                {sel.value && <span> — {JSON.stringify(sel.value)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <PdfButton leadId={lead.id} />
        <Link href="/portal/leads" className="rounded-lg border border-gray-300 px-6 py-3 text-sm hover:bg-gray-50 transition">
          Volver
        </Link>
      </div>
    </div>
  )
}
