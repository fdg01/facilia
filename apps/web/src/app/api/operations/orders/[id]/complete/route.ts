// src/app/api/operations/orders/[id]/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEmployee } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import {
  SupabaseWorkOrderRepository, SupabaseAssignmentRepository,
  SupabaseChecklistRepository, SupabaseExecutionRepository,
} from '@modules/operations/infrastructure'
import { createCompleteOrderUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const CompleteSchema = z.object({
  observations: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployee()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const parsed = CompleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const completeOrder = createCompleteOrderUseCase(
      new SupabaseWorkOrderRepository(serviceClient),
      new SupabaseAssignmentRepository(serviceClient),
      new SupabaseChecklistRepository(serviceClient),
      new SupabaseExecutionRepository(serviceClient),
    )

    const order = await completeOrder(id, session.userId, parsed.data.observations)
    return NextResponse.json({ data: order })
  } catch (error) {
    return handleApiError(error)
  }
}
