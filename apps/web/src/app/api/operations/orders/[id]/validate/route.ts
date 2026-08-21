// src/app/api/operations/orders/[id]/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createValidateExecutionUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const serviceClient = createServiceRoleSupabaseClient()
    const validateExecution = createValidateExecutionUseCase(new SupabaseWorkOrderRepository(serviceClient))
    const order = await validateExecution(id)
    return NextResponse.json({ data: order })
  } catch (error) {
    return handleApiError(error)
  }
}
