// modules/portal/presentation/components/ContractDetail.tsx
import Link from 'next/link'
import type { ContractSummary } from '../../domain/portal-entities'

interface ContractDetailProps {
  contract: ContractSummary
}

const statusLabels: Record<string, string> = {
  active: 'Vigente',
  suspended: 'Suspendido',
  ended: 'Finalizado',
}

export function ContractDetail({ contract }: ContractDetailProps) {
  return (
    <div className="space-y-6">
      <Link href="/portal/contracts" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a contratos
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-mono">{contract.number}</h1>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {statusLabels[contract.status] ?? contract.status}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Fecha de inicio</p>
            <p className="font-medium">{contract.startDate?.split('T')[0]}</p>
          </div>
          <div>
            <p className="text-gray-500">Fecha de fin</p>
            <p className="font-medium">{contract.endDate ? contract.endDate.split('T')[0] : 'Indefinido'}</p>
          </div>
          {contract.scope && (
            <div>
              <p className="text-gray-500">Alcance</p>
              <p className="font-medium">{contract.scope}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
