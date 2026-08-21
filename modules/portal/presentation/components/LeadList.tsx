// modules/portal/presentation/components/LeadList.tsx
import type { LeadSummary } from '../../domain/types'
import { LeadCard } from './LeadCard'

interface LeadListProps {
  leads: LeadSummary[]
  emptyMessage?: string
}

export function LeadList({ leads, emptyMessage = 'No hay cotizaciones para mostrar.' }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  )
}
