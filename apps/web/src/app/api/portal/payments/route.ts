// src/app/api/portal/payments/route.ts
import { NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePaymentReader } from '@modules/portal/infrastructure'
import { createListPaymentsUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireClient()
    const supabase = await createServerSupabaseClient()
    const listPayments = createListPaymentsUseCase(new SupabasePaymentReader(supabase))
    const payments = await listPayments(session.organizationId)
    return NextResponse.json({ data: payments })
  } catch (error) {
    return handleApiError(error)
  }
}
