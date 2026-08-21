// modules/portal/presentation/components/PaymentList.tsx
import Link from 'next/link'
import type { PaymentSummary } from '../../domain/portal-entities'

interface PaymentListProps {
  payments: PaymentSummary[]
}

const statusLabels: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800',
}

export function PaymentList({ payments }: PaymentListProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pagos</h1>
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          No hay pagos registrados
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Concepto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <Link
                  key={p.id}
                  href={`/portal/payments/${p.id}`}
                  className="contents hover:bg-gray-50"
                >
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{p.date.split('T')[0]}</td>
                    <td className="px-4 py-3 text-sm">{p.concept}</td>
                    <td className="px-4 py-3 text-sm font-semibold">${p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100'}`}>
                        {statusLabels[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
