// src/app/(portal)/portal/payments/page.tsx
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePaymentReader } from '@modules/portal/infrastructure'
import { createListPaymentsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { PaymentList } from '@modules/portal/presentation/components/PaymentList'

export default async function PaymentsPage() {
  const session = await requireClient()
  const supabase = await createServerSupabaseClient()
  const listPayments = createListPaymentsUseCase(new SupabasePaymentReader(supabase))
  const payments = await listPayments(session.organizationId)
  return <PaymentList payments={payments} />
}
