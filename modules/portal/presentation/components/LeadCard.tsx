// modules/portal/presentation/components/LeadCard.tsx
import Link from 'next/link'
import type { LeadSummary } from '../../domain/types'
import { StatusChip } from './StatusChip'

const lineLabels: Record<string, string> = {
  clean: 'FACILIA Clean',
  care: 'FACILIA Care',
  continuity: 'FACILIA Continuity',
}

export function LeadCard({ lead }: { lead: LeadSummary }) {
  return (
    <Link
      href={`/portal/leads/${lead.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono font-semibold text-gray-900">{lead.number}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(lead.createdAt).toLocaleDateString('es-UY')}
          </p>
        </div>
        <StatusChip status={lead.status} />
      </div>
      {lead.mainLine && (
        <p className="text-sm text-gray-600 mb-2">{lineLabels[lead.mainLine] ?? lead.mainLine}</p>
      )}
      <div className="flex justify-between text-sm pt-2 border-t">
        <div>
          <span className="text-gray-500">Mensual: </span>
          <span className="font-semibold text-orange-600">${lead.totalMonthly.toFixed(2)}</span>
        </div>
        {lead.totalPerVisit > 0 && (
          <div>
            <span className="text-gray-500">Por visita: </span>
            <span className="font-medium">${lead.totalPerVisit.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
