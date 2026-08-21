// modules/portal/presentation/components/ContractList.tsx
import Link from 'next/link'
import type { ContractSummary } from '../../domain/portal-entities'

interface ContractListProps {
  contracts: ContractSummary[]
}

const statusLabels: Record<string, string> = {
  active: 'Vigente',
  suspended: 'Suspendido',
  ended: 'Finalizado',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  ended: 'bg-gray-200 text-gray-600',
}

export function ContractList({ contracts }: ContractListProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis contratos</h1>
      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No tienes contratos vigentes
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/portal/contracts/${c.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono font-semibold text-gray-900">{c.number}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] ?? 'bg-gray-100'}`}>
                  {statusLabels[c.status] ?? c.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Inicio: {c.startDate?.split('T')[0]}</p>
                {c.endDate && <p>Fin: {c.endDate.split('T')[0]}</p>}
                {c.scope && <p>Alcance: {c.scope}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
