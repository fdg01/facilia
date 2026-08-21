// src/app/api/portal/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/portal-session'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SupabasePaymentReader } from '@modules/portal/infrastructure'
import { createGetPaymentUseCase } from '@modules/portal/application/use-cases/portal-complete-use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireClient()
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const getPayment = createGetPaymentUseCase(new SupabasePaymentReader(supabase))
    const payment = await getPayment(id, session.organizationId)
    if (!payment) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } }, { status: 404 })
    }
    return NextResponse.json({ data: payment })
  } catch (error) {
    return handleApiError(error)
  }
}
