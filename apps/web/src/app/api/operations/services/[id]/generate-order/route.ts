// src/app/api/operations/services/[id]/generate-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseScheduledServiceRepository, SupabaseWorkOrderRepository } from '@modules/operations/infrastructure'
import { createGenerateOrderFromServiceUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const serviceClient = createServiceRoleSupabaseClient()
    const generateOrder = createGenerateOrderFromServiceUseCase(
      new SupabaseScheduledServiceRepository(serviceClient),
      new SupabaseWorkOrderRepository(serviceClient),
    )
    const order = await generateOrder(id)
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
