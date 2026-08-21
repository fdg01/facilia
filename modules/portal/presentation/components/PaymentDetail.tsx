// modules/portal/presentation/components/PaymentDetail.tsx
import Link from 'next/link'
import type { PaymentSummary } from '../../domain/portal-entities'

interface PaymentDetailProps {
  payment: PaymentSummary
}

const statusLabels: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
}

export function PaymentDetail({ payment }: PaymentDetailProps) {
  return (
    <div className="space-y-6">
      <Link href="/portal/payments" className="text-gray-600 hover:text-gray-900 text-sm">
        ← Volver a pagos
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-bold mb-4">{payment.concept}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Fecha</p>
            <p className="font-medium">{payment.date.split('T')[0]}</p>
          </div>
          <div>
            <p className="text-gray-500">Monto</p>
            <p className="font-semibold text-lg">${payment.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Estado</p>
            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
              {statusLabels[payment.status] ?? payment.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
