// src/app/(portal)/portal/payments/[id]/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePaymentReader } from '@modules/portal/infrastructure'
import { createGetPaymentUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { PaymentDetail } from '@modules/portal/presentation/components/PaymentDetail'

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient()
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const getPayment = createGetPaymentUseCase(new SupabasePaymentReader(supabase))
  const payment = await getPayment(id, session.organizationId)
  if (!payment) {
    return <div className="text-center text-gray-500 py-12">Pago no encontrado</div>
  }
  return <PaymentDetail payment={payment} />
}
