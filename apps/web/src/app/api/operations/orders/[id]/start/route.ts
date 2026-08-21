// src/app/api/operations/orders/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseWorkOrderRepository, SupabaseAssignmentRepository, SupabaseExecutionRepository,
} from '@modules/operations/infrastructure'
import { createStartOrderUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    const { id } = await params
    const serviceClient = createServiceRoleSupabaseClient()
    const startOrder = createStartOrderUseCase(
      new SupabaseWorkOrderRepository(serviceClient),
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseExecutionRepository(serviceClient),
    )

    const result = await startOrder(id, session.userId)
    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
