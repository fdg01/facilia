// src/app/api/operations/orders/[id]/reassign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/operations-session'
import { createServiceRoleSupabaseClient } from '@modules/quoter/infrastructure'
import { SupabaseAssignmentRepository } from '@modules/operations/infrastructure'
import { createReassignPersonnelUseCase } from '@modules/operations/application/use-cases'
import { handleApiError } from '@/lib/api-helpers'

const ReassignSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1),
  reason: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const parsed = ReassignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const serviceClient = createServiceRoleSupabaseClient()
    const reassignUseCase = createReassignPersonnelUseCase(new SupabaseAssignmentRepository(serviceClient))

    const assignments = await reassignUseCase({
      workOrderId: id,
      organizationId: session.organizationId ?? '',
      employeeIds: parsed.data.employeeIds,
      reason: parsed.data.reason,
    })

    return NextResponse.json({ data: assignments })
  } catch (error) {
    return handleApiError(error)
  }
}
