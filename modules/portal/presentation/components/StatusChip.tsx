// modules/portal/presentation/components/StatusChip.tsx
import type { LeadStatus } from '../../domain/types'
import { formatStatus } from '../../domain/services'

const colorClasses: Record<string, string> = {
  navy: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
}

export function StatusChip({ status }: { status: LeadStatus }) {
  const { label, color } = formatStatus(status)
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colorClasses[color]}`}>
      {label}
    </span>
  )
}
